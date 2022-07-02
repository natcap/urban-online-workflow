# syntax=docker/dockerfile:1
# forcing --platform=linux/amd64 because we don't have arm builds of our conda-forge packages yet
FROM --platform=linux/amd64 mambaorg/micromamba:0.24.0-buster

ARG MAMBA_DOCKERFILE_ACTIVATE=1
RUN micromamba install -c conda-forge -y pygeoprocessing natcap.invest requests flask_cors

CMD /opt/conda/bin/python /opt/worker/worker.py --queue_ip 0.0.0.0 --queue_port 8000
