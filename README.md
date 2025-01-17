# OmicsDM_v2
Holds sources for the version 2 of Omics Data Management platform

## Run Server

### Environment

```sh
cd server/
python3 -m venv venv
source venv/bin/activate
pip3 install "biodm[kubernetes] @ git+https://github.com/bag-cnag/biodm"
pip3 install -r requirements.txt
```

### Dependencies

```sh
docker compose up -d
```

### Run

After those pre-requisite steps you may either use the provided `VSCode` run and debug entry or
run manually

```sh
python3 app.py 
```

## Run Client

This step assumes you are using `nvm`

Client is developped using node `v23.1.0`

```sh
cd client/
nvm use 23
npm install
npm run dev
```
