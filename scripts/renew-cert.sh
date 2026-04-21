#!/usr/bin/env bash
# renew the certificate. use --dry-run flag for testing.
cd /home/ddenu/urban-online-workflow;

date >> /home/ddenu/cronjoblogs.txt;

# --force-renew : force cert to renew even if not set to expire 
# --webroot : use the active webserver to place challenge, so Certbot
#             doesn't need to listen on port 80 directly.
docker compose run --rm certbot certonly --force-renew \
	--webroot --webroot-path /var/www/certbot/ \
	-d urbanonline.naturalcapitalproject.org;
