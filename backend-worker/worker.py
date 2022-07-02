import argparse
import logging
import time

import requests

logging.basicConfig(level=logging.INFO)
LOGGER = logging.getLogger(__name__)


def do_work(ip, port):
    LOGGER.info(f'Starting worker, queueing {ip}:{port}')
    while True:
        #response = requests.get(f'{ip}/jobsqueue/:{port}')
        LOGGER.info("Placeholder for polling the jobs queue")
        time.sleep(1)


def main():
    parser = argparse.ArgumentParser(
        __name__, description=('Worker for Urban Online Workflow'))
    parser.add_argument('--queue_ip')
    parser.add_argument('--queue_port')

    args = parser.parse_args()
    do_work(
        ip=args.queue_ip,
        port=args.queue_port
    )


if __name__ == '__main__':
    main()
