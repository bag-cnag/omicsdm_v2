# OmicsDM V1->V2 -- DB Migration

DB Migration script

## Populate .env

Populate the .env file with DB, Keycloak and S3 bucket credentials.

## Create virtual env

```sh
python3 -m venv venv
source venv/bin/activate
pip3 install -r requirements.txt
```

## Run

```sh
python3 migration.py
```

If no errors occur, the script will issue a `COMMIT`, otherwise a `ROLLBACK`

## Misc

This scipt is doing a lot of bookeeping by storing data in the RAM, it is not appropriate for
a very large database migration.
