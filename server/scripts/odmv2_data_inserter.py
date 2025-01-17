#!/bin/python
import requests
import json
from typing import Dict, Any, List
from pathlib import Path

from bs4 import BeautifulSoup


ADMIN_USERNAME = 'admin'
ADMIN_PASSWORD = '12345'
SRV_URL = "http://0.0.0.0:8000"
FILES_PATH = "/home/ejodry/Repositories/omicsdm_k8/datasets/"
CHUNK_SIZE = 100*1024**2


def json_bytes(d: Dict[Any, Any] | List[object | Dict[Any, Any]]) -> bytes:
    """Encodes python Dict as utf-8 bytes."""
    return json.dumps(d).encode('utf-8')


def keycloak_login(username, password, access_only=True):
    # Get and Parse form with bs
    # Courtesy of: https://www.pythonrequests.com/python-requests-keycloak-login/
    login_url = requests.get(f'{SRV_URL}/login')
    with requests.Session() as session:
        form_response = session.get(login_url.text)

        soup = BeautifulSoup(form_response.content, 'html.parser')
        form = soup.find('form')
        action = form['action']
        other_fields = {
            i['name']: i.get('value', '')
            for i in form.findAll('input', {'type': 'hidden'})
        }

        response = session.post(action, data={
            'username': username,
            'password': password,
            **other_fields,
        }, allow_redirects=True)

        assert response.status_code == 200

        token = json.loads(response.text)
        if access_only:
            return token['access_token']
        return token


def multipart_upload(filepath, parts) -> List[Dict[str, str]]:
    parts_etags = []
    with open(filepath, 'rb') as file:
        for part in parts:
            assert 'form' in part

            part_data = file.read(CHUNK_SIZE)
            response = requests.put(
                part['form'], data=part_data, headers={'Content-Encoding': 'gzip'}
            )
            assert response.status_code == 200

            # Get etag.
            etag = response.headers.get('ETag', "").replace('"', '') # comes with trailing quotes.
            assert etag

            parts_etags.append({'PartNumber': part['part_number'], 'ETag': etag})
    return parts_etags


def admin_header():
    """Set header for admin token bearer."""
    admin_token = keycloak_login(ADMIN_USERNAME, ADMIN_PASSWORD)
    return {'Authorization': f'Bearer {admin_token}'}


groups = [{
  "path": "admin",
  "users": [
      {"username": "admin"}
  ]
},{
  "path": "CNAG",
  "children": [
    {
      "path": "CNAG__OMICS",
      "users": [
        {
          "username": "neo",
          "password": "1234",
          "email": "neo@keycloak.local",
          "firstName": "Thomas",
          "lastName": "Anderson"
        }
      ]
    }
  ]
}]


projects = [
    {
        "short_name": "proj_01",
        "long_name": "My project number one",
        "description": "Ea sapiente iure maiores ipsam. Deserunt non voluptatem tempora repellendus qui exercitationem repellendus quod. Quaerat cupiditate quas sit. Recusandae in praesentium dolorum. Ad non nulla explicabo tempora voluptatem. Ex aut hic sint provident eveniet.",
        "logo_url": "https://cdn.pixabay.com/photo/2016/11/07/13/04/yoga-1805784_960_720.png",
        "datasets": [{
            "short_name": "dataset_0101",
            "long_name": "My dataset number one, from project number one",
            "description": "Maecenas feugiat odio efficitur erat.",
            "disease": "ASTHMA",
            "treatment": "Asprin",
            "molecular_info": "aaaa",
            "sample_type": "bbbb",
            "data_type": "cccc",
            "value_type": "dddd",
            "platform": "gggg",
            "genome_assembly": "eeee",
            "annotation": "ffff",
            "samples_count": "999",
            "features_count": "512",
            "features_id": "hhhh",
            "healthy_controls_included": "true",
            "additional_info": "jjjj",
            "tags": [{"name": "skibidi"},{"name": "bapbap"}],
            "contact_username": "neo",
            "files": [
                {
                    "filename": "test01",
                    "extension": "h5ad",
                    "size": "616578898",
                    "type": "molecular",
                    "comment": "abcd"
                },
                {
                    "filename": "test02",
                    "extension": "h5ad",
                    "size": "24653425",
                    "type": "molecular",
                    "comment": "efghi"
                },
                {
                    "filename": "test03",
                    "extension": "csv",
                    "size": "60",
                    "type": "clinical",
                    "comment": "lmnop"
                },
                {
                    "filename": "test04",
                    "extension": "csv",
                    "size": "60",
                    "type": "clinical",
                    "comment": "rstuv"
                },
                {
                    "filename": "test05",
                    "extension": "pdf",
                    "size": "39872",
                    "type": "licence",
                    "comment": "hjdgh"
                },
            ],
            "perm_self": {
                "read": {"groups": [{"path": "CNAG"}]}
            }
        },{
            "short_name": "dataset_0102",
            "long_name": "My dataset number two, from project number one",
            "description": "Nam et nisi quam. Nunc..",
            "disease": "COPD",
            "treatment": "Anti Inflamatory",
            "molecular_info": "zzzz",
            "sample_type": "yyyy",
            "data_type": "xxxx",
            "value_type": "wwww",
            "platform": "vvvv",
            "genome_assembly": "uuuu",
            "annotation": "tttt",
            "samples_count": "888",
            "features_count": "256",
            "features_id": "ssss",
            "healthy_controls_included": "true",
            "additional_info": "rrrr",
            "tags": [{"name": "skibidi"},{"name": "bapbap"}],
            "contact_username": "neo"
        }],
        "perm_datasets": {
            "write": {"groups": [{"path": "CNAG"}]}
        }
    },
    {
        "short_name": "proj_02",
        "long_name": "My project number two",
        "description": "Fuga optio fugit facilis dolores. Error quia in voluptates autem iste doloribus voluptate. Pariatur consectetur molestias tempora at repudiandae placeat similique. Cum numquam est debitis ipsum quam. Voluptatum et ut est iste voluptas ut fugiat.",
        "logo_url": "https://cdn.pixabay.com/photo/2020/09/16/18/39/icon-5577198_960_720.png",
    },
    {
        "short_name": "proj_03",
        "long_name": "My project number three",
        "description": "Dolorem numquam beatae aut aut enim ipsam assumenda. Nam deleniti rem quod ipsa consequatur modi facilis necessitatibus. Sapiente aut et enim quisquam et. Deserunt fuga veritatis soluta facere a. Dolores dolorem sed excepturi ipsam laudantium qui dolor.",
        "logo_url": "https://cdn.pixabay.com/photo/2014/04/02/10/16/fire-303309_960_720.png",
    },
    {
        "short_name": "proj_04",
        "long_name": "My project number four",
        "description": "Qui id eum sit eligendi harum. Sit saepe repellendus quasi et ea fuga. Nisi occaecati facere qui error id ut quod.",
        "logo_url": "https://cdn.pixabay.com/photo/2023/03/06/13/58/brand-7833518_960_720.png",
    },
]

ADMIN_HEADER = admin_header()

gr_response = requests.post(
    f"{SRV_URL}/groups",
    data=json_bytes(groups),
    headers=ADMIN_HEADER
)

# print(gr_response.text)
assert gr_response.status_code == 201

pr_response = requests.post(
    f"{SRV_URL}/projects",
    data=json_bytes(projects),
    headers=ADMIN_HEADER
)


# print(pr_response.text)
assert pr_response.status_code == 201
pr_json = json.loads(pr_response.text)

# Upload files:
for file in pr_json[0]['datasets'][0]['files']:
    if file['filename'] == 'test01' and file['extension'] == 'h5ad':
        file_path = Path(FILES_PATH, f"test_big.{file['extension']}")
    else:
        file_path = Path(FILES_PATH, f"test.{file['extension']}")
    # Upload file
    parts_etags = multipart_upload(file_path, file['upload']['parts'])

    # Send completion notice.
    complete = requests.put(
        f"{SRV_URL}/files/{file['id']}_{file['version']}/complete",
        data=json_bytes(parts_etags),
        headers=ADMIN_HEADER
    )
    assert complete.status_code == 201
    assert 'Completed.' in complete.text
