from typing import Type, Tuple
import asyncio
from email.utils import parseaddr
import os
import re
import warnings


from dotenv import load_dotenv


from keycloak.keycloak_admin import KeycloakAdmin
from keycloak.openid_connection import KeycloakOpenIDConnection
import boto3
from sqlalchemy import MetaData
from sqlalchemy import select
from sqlalchemy import func
from sqlalchemy import text
from sqlalchemy.ext.automap import automap_base
from sqlalchemy.ext.automap import generate_relationship
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.ext.asyncio import AsyncAttrs
from sqlalchemy.ext.asyncio import create_async_engine
from sqlalchemy.ext.asyncio import async_sessionmaker
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import registry
from sqlalchemy.orm import DeclarativeBase

# import warnings
# from sqlalchemy.exc import SAWarning, SADeprecationWarning


# # warnings.filterwarnings('error')
# warnings.filterwarnings('error', category=SAWarning)
# warnings.filterwarnings('ignore', category=SADeprecationWarning)


load_dotenv()


# S3
s3 = boto3.resource(
    's3',
    endpoint_url=os.getenv('S3_ENDPOINT_URL'),
    aws_access_key_id=os.getenv('S3_ACCESS_KEY_ID'),
    aws_secret_access_key=os.getenv('S3_SECRET_ACCESS_KEY'),
    region_name="us-east-1",
    verify=False,
)


# KC
mapping = {
    'realm_name': os.getenv('KC_REALM'),
    'server_url': os.getenv('KC_HOST'),
    'verify': True
}

if os.getenv('KC_ADMIN_TOKEN'):
    mapping.update({
        'token': {
          'access_token': os.getenv('KC_ADMIN_TOKEN'),  
          'expires_in': 3600,
        }
    })
elif os.getenv('KC_ADMIN_ACCOUNT') and os.getenv('KC_ADMIN_PASSWORD'):
    mapping.update({
        'user_realm_name': "master",
        'username': os.getenv('KC_ADMIN_ACCOUNT'),
        'password': os.getenv('KC_ADMIN_PASSWORD'),
    })
else:
    raise Exception("Missing keycloak credentials.")


kc_admin = KeycloakAdmin(connection=KeycloakOpenIDConnection(**mapping))


# DB
src_engine = create_async_engine(os.getenv('SOURCE_DB_URL'), echo=False)
src_session = async_sessionmaker(src_engine, class_=AsyncSession, expire_on_commit=False)
dst_engine = create_async_engine(os.getenv('TARGET_DB_URL'), echo=False)
dst_session = async_sessionmaker(dst_engine, class_=AsyncSession, expire_on_commit=False)
src_metadata = MetaData()
dst_metadata = MetaData()


#  Declarative bases
class SrcBase(DeclarativeBase, AsyncAttrs): ...
class DstBase(DeclarativeBase, AsyncAttrs): ...
SrcBase = automap_base(SrcBase)
DstBase = automap_base(DstBase)


# Model import methods
def reflect_metadata(conn, metadata: MetaData):
    metadata.reflect(bind=conn, resolve_fks=True)


i = 0
def generate_dst_relationship(base, direction, return_fn,
                                attrname, local_cls, referred_cls, **kw):
    """Hack to give them unique names.
    It doesn't matter too much but may cause some relationship naming to be unrealiable."""
    global i
    i = i+1
    return generate_relationship(base, direction, return_fn,
                                 attrname+'_ref'+str(i), local_cls, referred_cls, **kw)


def prepare_base(conn, base: Type[DeclarativeBase]):
    if base == SrcBase:
        base.prepare(conn, reflect=True)
    else: # Handle autobackref quirks for dst
        base.prepare(
            conn,
            reflect=True,
            generate_relationship=generate_dst_relationship,
        )


async def prepare_models(engine, base: Type[DeclarativeBase], metadata: MetaData):
    try:
        async with engine.begin() as conn:
            await conn.run_sync(reflect_metadata, metadata)
            await conn.run_sync(prepare_base, base)

        return base.classes
    except SQLAlchemyError as e:
        print(f"Error during database reflection: {e}")


async def main():
    # Get tables
    src_tables = await prepare_models(src_engine, SrcBase, src_metadata)
    dst_tables = await prepare_models(dst_engine, DstBase, dst_metadata)

    # Handle missing ones, which are not mapped properly because of composite PK
    mapper_registry = registry()

    # DST - ASSO_PERM_DATASET_FILES
    class DstAssoPermDatasetFiles: ...
    mapper_registry.map_imperatively(
        DstAssoPermDatasetFiles, dst_metadata.tables['asso_perm_dataset_files'.upper()]
    )
    # DST - ASSO_DATASET_TAG
    class DstAssoDatasetTag: ...
    mapper_registry.map_imperatively(
        DstAssoDatasetTag, dst_metadata.tables['asso_dataset_tag'.upper()]
    )
    # DST - ASSO_DATASET_FILE
    class DstAssoDatasetFile: ...
    mapper_registry.map_imperatively(
        DstAssoDatasetFile, dst_metadata.tables['asso_dataset_file'.upper()]
    )

    # Helper functions
    def src_t(name: str):
        """SRC Tables."""
        return getattr(src_tables, name)

    def dst_t(name: str):
        """DST Tables."""
        return getattr(dst_tables, name.upper())

    def gec(obj, key, default=None):
        """Get from extra cols, accounting for it being nullable."""
        return (getattr(obj, 'extra_cols', {}) or {}).get(key, default)

    def is_valid_email(email):
        """Loose email validator."""
        _, addr = parseaddr(email)
        return '@' in addr and '.' in addr.split('@')[-1]

    def get_s3_file_size(key: str):
        """Query S3 bucket for the size of associated file."""
        with warnings.catch_warnings(action="ignore"):
            try:
                obj = s3.Object(os.getenv('S3_BUCKET_NAME'), key)
                return obj.content_length  # size in bytes; ClientError if file does not exist
            except:
                raise Exception(f"s3 - {key} not found")

    class S3Exception(Exception): ...

    def build_key_and_get_size(
        owner_group,
        dataset_id,
        file_type_separator,
        filename,
        molecular: bool= False
    ) -> Tuple[str, str, int]:
        # Handle culprit filename
        if "3TRMS_DATA_LABELS_2024-03-17_1301" in filename:
            dataset_id = '3TR_MS_'

        size = None
        root, ext = filename.split('.', maxsplit=1)
        key = owner_group + '/' + dataset_id + '/' + file_type_separator
        if not molecular:
            key = key + (
                '/' + root
            )

        try:
            size = get_s3_file_size(key + '.' + ext)
            return key, ext, size
        except Exception as e:
            print({e})
            raise S3Exception()

    async def set_sequence_to_max(table: Type[DeclarativeBase], column: str, session: AsyncSession):
        """Sets sequence attached on column to max value that is stored in the table."""
        try:
            col = getattr(table, column)
            seq_text = table.__table__.columns[column].server_default.arg.text
            seq_name = re.search(r'\"([^"]*)\"', seq_text).group()

            stmt = select(func.max(col))
            max_id = (await session.scalar(stmt)) or 1

            await session.execute(
                text(f"SELECT setval('{seq_name}', :val, true)"),
                {'val': max_id}
            )
        except Exception as e:
            raise Exception(f"Error reseting {column} sequence on table {table.__name__}: {e}")

    # Listgroups
    sample = dst_t("listgroup")() # Somehow, it causes bugs when doing it on the class directly
    lg_c_field = next(attr for attr in dir(sample) if str(attr).startswith('group_collection'))

    # Lookup tables
    src_files_by_dataset_id = {} # SRC files by SRC dataset_id
    dst_groups_by_src_id = {} # DST groups by SRC group_id
    dst_groups_by_name = {} # DST groups by name
    dst_dataset_short_names_by_id = {} # DST dataset.short_name by dataset.id
    dst_dataset_owner_by_dataset_id = {}

    async with src_session() as src_s, dst_session() as dst_s:
        try:
            ## GROUP
            # Get all from kc and format.
            kc_groups = {
                group['name']: group
                for group in await kc_admin.a_get_groups()
            }

            stmt = select(src_t("group"))
            src_groups = (await src_s.scalars(stmt)).unique().all()

            for one in src_groups:
                # 1. Search keycloak
                groupname = one.kc_groupname.strip()
                kc_group = kc_groups.get(groupname, None)
                if not kc_group: # If not present, create it.
                    kc_group_id = kc_admin.create_group({"name": groupname})
                    kc_group = kc_admin.get_group(kc_group_id)
                    kc_groups[kc_group['name']] = kc_group # Add to list in case

                # 2. Create mapping
                mapping = {
                    'id': kc_group['id'],
                    'path': kc_group['path'][1:].replace('/', '__'),
                }

                # 3. Instanciate and add to session
                mapped = dst_t("group")(**mapping)
                mapped = await dst_s.merge(mapped)

                # 4. Add to lookup table
                dst_groups_by_src_id[one.id] = mapped
                dst_groups_by_name[groupname] = mapped

            # 5. Flush to validate changes
            await dst_s.flush()

            ## USER
            # New table, doesn't exist in v1.
            # However, there are columns reffering to usernames in v1.
            #     -> datasets.submitter_name
            #     -> files.submitter_name
            kc_users = {
                user['username']: user
                for user in await kc_admin.a_get_users()
            }

            # Get referenced usernames
            stmta = select(src_t("datasets").submitter_name)
            stmtb = select(src_t("files").submitter_name)
            stmt = stmta.union(stmtb)
            src_users = (await src_s.scalars(stmt)).unique().all()

            for src_username in src_users:
                # 1. Get user information through KC, raise if not exists
                kc_user = kc_users.get(src_username, None)
                if not kc_user: # If missing, create it on the fly.
                    payload = {
                        "username": src_username,
                        "enabled": True,
                        "requiredActions": [],
                        "groups": [],
                        "emailVerified": False,
                    }
                    kc_user_id = kc_admin.create_user(payload, exist_ok=True) # create
                    kc_user = kc_admin.get_user(kc_user_id) # get from id
                    kc_users[src_username] = kc_user # add to the list

                # 2. Mapping
                mapping = {
                    'id': kc_user['id'],
                    'username': kc_user['username'],
                    'email': kc_user.get('email', None),
                    'firstName': kc_user.get('firstName', None),
                    'lastName': kc_user.get('lastName', None),
                }

                # 3. Instanciate and add to session
                mapped_user = dst_t("user")(**mapping)
                mapped_user = await dst_s.merge(mapped_user)

                # 4. pickup user-group information
                kc_user_groups = await kc_admin.a_get_user_groups(
                    user_id=kc_user['id'], brief_representation=True
                )

                # Get collection
                c_field = next(
                    attr for attr in dir(mapped_user) if str(attr).startswith('group_collection')
                )
                collection = await getattr(mapped_user.awaitable_attrs, c_field)

                if len(kc_user_groups) == 1:
                    group_name = kc_user_groups[0]['name']

                    # 5. Add to group collection
                    if dst_groups_by_name.get(group_name):
                        if dst_groups_by_name.get(group_name) not in collection:
                            collection.append(dst_groups_by_name.get(group_name))

                else:
                    raise Exception(
                        "Integrity Error: OmicsDM V1 users should belong to at most one group."
                    )

            # 6. Validate
            await dst_s.flush()

            ## PROJECT
            stmt = select(src_t("projects"))
            src_projects = (await src_s.scalars(stmt)).unique().all()
            for one in src_projects:
                mapping = {
                    'id': one.id,
                    'short_name': one.project_id,
                    'long_name': one.name,
                    'created_at': one.created_at,
                    'description': gec(one, 'description'),
                    'logo_url': gec(one, 'logo_url'),
                }

                mapped_project = dst_t("project")(**mapping)
                dst_s.add(mapped_project)

                # Find owners
                owners = [
                    dst_groups_by_src_id[src_id_owner]
                    for src_id_owner in getattr(one, "owners", [])
                ]

                # Process permission
                perm = dst_t("asso_perm_project_datasets")(**{'id_project': one.id})
                dst_s.add(perm)

                # write
                lg_write = dst_t("listgroup")() #{lg_class()
                setattr(lg_write, lg_c_field, owners)
                dst_s.add(lg_write)

                # download
                lg_download = None
                if not gec(one, 'file_dl_allowed', False):
                    lg_download = dst_t("listgroup")() # lg_class()
                    setattr(lg_download, c_field, owners)
                    dst_s.add(lg_download)

                await dst_s.flush() # Generate ids

                perm.id_write = lg_write.id
                if lg_download:
                    perm.id_download = lg_download.id

            # Validation
            await dst_s.flush()

            ## DATASET
            dst_tags_map = {}
            dataset_attached_files = []

            stmt = select(src_t("datasets")).order_by(src_t("datasets").id)
            src_datasets = (await src_s.scalars(stmt)).unique().all()

            for one in src_datasets:
                contact_email = gec(one, 'contact', os.getenv('DEFAULT_CONTACT_EMAIL'))
                if not is_valid_email(contact_email):
                    contact_email = os.getenv('DEFAULT_CONTACT_EMAIL')

                mapping = {
                    # MGMT
                    'id': one.id,
                    'short_name': one.dataset_id,
                    'long_name': one.name,
                    'submission_date': one.submission_date,
                    # FK
                    'submitter_username': one.submitter_name,
                    'contact_email': contact_email,
                    'project_id': one.project_id,
                    # Bio
                    'treatment': gec(one, 'treatment', ''),
                    'molecular_info': gec(one, 'molecularInfo', ''),
                    'sample_type': gec(one, 'sampleType', ''),
                    'data_type': gec(one, 'dataType', ''),
                    'value_type': gec(one, 'valueType', ''),
                    'platform': gec(one, 'platform', ''),
                    'genome_assembly': gec(one, 'genomeAssembly', ''),
                    'annotation': gec(one, 'annotation', ''),
                    'samples_count': int(gec(one, 'samplesCount', 0)),
                    'features_count': int(gec(one, 'featuresCount', 0)),
                    'features_id': gec(one, 'featuresID', ''),
                    'healthy_controls_included': gec(one, 'healthyControllsIncluded', False),
                    'additional_info': gec(one, 'additionalInfo', None),
                }

                # Handle disease
                disease = gec(one, 'disease', 'HEALTHY')
                if disease.lower().strip() == 'healthy control':
                    disease = 'HEALTHY'
                mapping['disease'] = disease

                # Instanciate, add to session and generate id
                mapped_dataset = dst_t("dataset")(**mapping)
                dst_s.add(mapped_dataset)
                await dst_s.flush()
                dst_dataset_short_names_by_id[one.id] = one.dataset_id

                # Find owners
                stmt = (
                    select(src_t("dataset_group"))
                    .where(src_t("dataset_group").dataset_id == one.id)
                )
                src_dataset_groups = (await src_s.scalars(stmt)).unique().all()
                owners = [
                    dst_groups_by_src_id[link.group_id]
                    for link in src_dataset_groups or []
                ]

                if len(owners) != 1:
                    print(f"Exc: dataset {one.dataset_id} has {len(owners)} (!= 1) owners.")

                owner = owners[0]
                dst_dataset_owner_by_dataset_id[one.dataset_id] = owner

                # Find shared_with
                shared_with = [
                    dst_groups_by_src_id[src_id_owner]
                    for src_id_owner in getattr(one, "shared_with", [])
                ]

                # Process permission files
                perm_files = DstAssoPermDatasetFiles(**{'id_dataset': one.id, 'version_dataset': 1})
                dst_s.add(perm_files)
                if owners:
                    lg_write = dst_t("listgroup")() # lg_class()
                    setattr(lg_write, lg_c_field, owners)
                    dst_s.add(lg_write)
                    await dst_s.flush()
                    perm_files.id_write = lg_write.id

                # Process permission self
                shared_with = list(set(shared_with) | set(owners))
                perm_self = dst_t("asso_perm_dataset_self")(
                    **{'id_dataset': one.id, 'version_dataset': 1}
                )
                dst_s.add(perm_self)

                if shared_with:
                    lg_read = dst_t("listgroup")()
                    lg_download = dst_t("listgroup")()
                    setattr(lg_read, lg_c_field, shared_with)
                    setattr(lg_download, lg_c_field, shared_with)
                    dst_s.add(lg_read)
                    dst_s.add(lg_download)
                    await dst_s.flush()
                    perm_files.id_read = lg_read.id
                    perm_files.id_download = lg_download.id

                # Handle tags
                tags = gec(one, 'tags', None)
                if tags:
                    tags = tags.split(' ')
                    for tag in tags:
                        tag_inst = None
                        if tag in dst_tags_map:
                            tag_inst = dst_tags_map[tag]
                        else:
                            tag_inst = dst_t("tag")(name=tag)
                            await dst_s.merge(tag_inst)

                        await dst_s.flush()

                        link = DstAssoDatasetTag(
                            dataset_id=mapped_dataset.id, dataset_version=1, tag_name=tag_inst.name
                        )
                        dst_s.add(link)

                # Validate Dataset
                await dst_s.flush()

                # Handle attached files
                licence_file = gec(one, 'file')
                if licence_file:
                    for file in licence_file:
                        try:
                            key, ext, size = build_key_and_get_size(
                                owner_group=owner.path,
                                dataset_id=dst_dataset_short_names_by_id[mapped_dataset.id],
                                file_type_separator='dataPolicy',
                                filename=file
                            )
                            mapping = {
                                'dataset_id': mapped_dataset.id,
                                'dataset_version': 1,
                                'filename': key,
                                'extension': ext,
                                'enabled': True,
                                'ready': True,
                                'dl_count': 0,
                                'emited_at': one.submission_date,
                                'validated_at': one.submission_date,
                                'submitter_username': one.submitter_name,
                                'type': 'licence',
                                'size': size,
                                'key_salt': '' # Not necessary for v1 data.
                            }
                            # Store to insert after sequence reset at the end.
                            dataset_attached_files.append(dst_t("file")(**mapping))

                        except S3Exception:
                            continue

                        except Exception as e:
                            print("Exc (1): ", e)

                clinical_file = gec(one, 'file2')
                if clinical_file:
                    for file in clinical_file:
                        try:
                            key, ext, size = build_key_and_get_size(
                                owner_group=owner.path,
                                dataset_id=dst_dataset_short_names_by_id[mapped_dataset.id],
                                file_type_separator='clinical',
                                filename=file
                            )
                            mapping = {
                                'dataset_id': mapped_dataset.id,
                                'dataset_version': 1,
                                'filename': key,
                                'extension': ext,
                                'enabled': True,
                                'ready': True,
                                'dl_count': 0,
                                'emited_at': one.submission_date,
                                'validated_at': one.submission_date,
                                'submitter_username': one.submitter_name,
                                'type': 'clinical',
                                'size': size,
                                'key_salt': '' # Not necessary for v1 data.
                            }
                            # Store to insert after sequence reset at the end.
                            dataset_attached_files.append(dst_t("file")(**mapping))

                        except S3Exception:
                            continue

                        except Exception as e:
                            print("Exc (2): ", e)

            ## FILE
            stmt = select(src_t("files"))
            src_files = (await src_s.scalars(stmt)).unique().all()

            # Prepare data structure to process information
            for one in src_files:
                src_files_by_dataset_id[one.dataset_id] = (
                    src_files_by_dataset_id.get(one.dataset_id, {})
                )
                src_files_by_dataset_id[one.dataset_id][one.name] = (
                    src_files_by_dataset_id[one.dataset_id].get(one.name, [])
                )
                src_files_by_dataset_id[one.dataset_id][one.name].append(one)                

            # re-align by id
            for dataset_id, files in src_files_by_dataset_id.items():
                src_files_by_dataset_id[dataset_id] = {
                    min(file.id for file in v): v
                    for v in files.values()
                }

            # Iterate
            for dataset_id, files in src_files_by_dataset_id.items():
                for file_id, file_versions in files.items():
                    for file in file_versions:
                        # try:
                        key, ext, size = build_key_and_get_size(
                            owner_group=dst_dataset_owner_by_dataset_id[dataset_id].path,
                            dataset_id=dst_dataset_short_names_by_id[file.dataset_id],
                            file_type_separator=file.name + '_uploadedVersion_' + str(file.version),
                            filename=file,
                            molecular=True
                        )

                        if len(ext.split('.')) > 1:
                            ext = ext.split('.')[-1]
                            mapping = {
                                'id': file_id,
                                'version': file.version,
                                'dataset_id': file.dataset_id,
                                'dataset_version': 1,
                                'filename': key,
                                'extension': ext,
                                'description': gec(file, 'comment'),
                                'enabled': file.enabled,
                                'ready': file.upload_finished,
                                'dl_count': 0,
                                'emited_at': file.submission_date,
                                'validated_at': file.submission_date,
                                'submitter_username': file.submitter_name,
                                'type': 'molecular',
                                'size': size,
                                'key_salt': '' # Not necessary for v1 data.
                            }

                            mapped_file = dst_t("file")(**mapping)
                            dst_s.add(mapped_file)

                            # print("## Molecular file: ", mapped_file)

                        # except S3Exception:
                        #     continue

                        # except Exception as e:
                        #     print("Exc (3): ", e)
                        #     print(
                        #         dst_dataset_owner_by_dataset_id[dataset_id].path, " , ",
                        #         dst_dataset_short_names_by_id[file.dataset_id], " , ",
                        #         dataset_id, " , ", file.dataset_id,
                        #     )
                        #     print("----")

            await dst_s.flush()

            # set relevant sequences
            await set_sequence_to_max(dst_t('file'), 'id', dst_s)
            await set_sequence_to_max(dst_t('dataset'), 'id', dst_s)
            await set_sequence_to_max(dst_t('project'), 'id', dst_s)

            # Add attached files, after sequence set
            if dataset_attached_files:
                dst_s.add_all(dataset_attached_files)
                await dst_s.flush()

        except Exception as e:
            print(f"Error during database reflection: {e}")
            await dst_s.rollback()
            raise

        # await dst_s.rollback() # For testing
        await dst_s.commit() # When ready


if __name__ == "__main__":
    asyncio.run(main())
