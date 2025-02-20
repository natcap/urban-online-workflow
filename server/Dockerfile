# syntax=docker/dockerfile:1
FROM python:3.9-bullseye
RUN pip install uvicorn[standard] fastapi httpx sqlalchemy requests shapely

EXPOSE 8000

# The working directory
ENV UVICORN_APP_DIR /opt/server

# Needed in order to expose networking outside of container.
# equivalent to --host 0.0.0.0
ENV UVICORN_HOST 0.0.0.0

# Setting directory which will then be where DB lives.
WORKDIR /opt/server

CMD /usr/local/bin/uvicorn "sql_app.main:app"
