# syntax=docker/dockerfile:1
# forcing --platform=linux/amd64 because we don't have arm builds of our conda-forge packages yet
FROM --platform=linux/amd64 mambaorg/micromamba:0.24.0-buster
USER root
RUN mkdir /opt/appdata
RUN chmod -R 777 /opt/appdata
USER $USER
ARG MAMBA_DOCKERFILE_ACTIVATE=1
RUN micromamba install -c conda-forge -y "sqlite<=3.48" "libsqlite<=3.48" pygeoprocessing natcap.invest=3.14.3 requests flask_cors pillow geopandas

CMD /opt/conda/bin/python
