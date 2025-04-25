# OmicsDM_v2
Holds sources for the version 2 of Omics Data Management platform

## Run Server

### Python Environment

```sh
cd server/
python3 -m venv venv
source venv/bin/activate
pip3 install "biodm[kubernetes] @ git+https://github.com/bag-cnag/biodm"
pip3 install -r requirements.txt
```

### Dependencies

```sh
docker compose up --build -d
```

### Configuration

Populate `server/.env` file with desired configuration.

### Run

After those pre-requisite steps you may either use the provided `VSCode` run and debug entry or
run manually

```sh
python3 app.py 
```

Warning: You should run the python it in the immediate directory of `app.py` so that `.env` is accounted for.

## Run Client

Client is developped using node `v23.1.0`, assuming you're using nvm you should preface with
this command.

```sh
cd client/
nvm use 23
npm install
```

### Configuration

You should populate `client/static/config.json` with appropriate configuration, in partocular your server endpoint.

### Fetch client

Once your server is running and configuration is populated, you should run the following command
in order to generate a type safe client based on the OpenAPI description of the server.

```sh
npx @hey-api/openapi-ts
```

### Run

```sh
npm run dev
```
