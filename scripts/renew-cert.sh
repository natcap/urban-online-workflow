#!/usr/bin/env bash
# renew the certificate. use --dry-run flag for testing.
cd /home/ddenu/urban-online-workflow;

docker compose run --rm certbot certonly --force-renew --webroot --webroot-path /var/www/certbot/ -d urbanonline.naturalcapitalproject.org;

date >> /home/ddenu/cronjoblogs.txt;
