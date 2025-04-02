# FROM python:3.11-slim-bookworm
FROM python:3.11-alpine


# RUN apt-get update && apt-get install -y git
RUN apk update && apk add git

WORKDIR /pkg


RUN --mount=type=cache,target=/root/.cache/pip \
    git clone -b dev --single-branch https://github.com/bag-cnag/biodm.git && \
    cd biodm && \
    pip3 install -r src/requirements/dev.txt && \
    pip3 install .

COPY ./ /app


WORKDIR /app

RUN pip3 install .

EXPOSE 8000

CMD ["python3", "app.py"]
