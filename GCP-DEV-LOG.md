## 2022-07-18

Static IP address for our vm has been reserved in anticipation of creating a real URL for this on naturalcapitalproject.org and setting up letsencrypt over nginx

## 2022-07-05

1. Went through the steps at https://docs.docker.com/engine/install/debian/ to reinstall docker and get the latest `docker compose`:
   ```
   sudo apt-get remove docker docker-engine docker.io containerd runc
   sudo apt-get update && sudo apt-get install ca-certificates curl gnupg lsb-release
   sudo mkdir -p /etc/apt/keyrings
   curl -fsSL https://download.docker.com/linux/debian/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
   echo \
      "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/debian \
      $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
   sudo apt-get update
   sudo apt-get install docker-ce docker-ce-cli containerd.io docker-compose-plugin
   ```
   
   
## 2022-06-16

Turns out that we need some CORS configuration in order to access the bucket
from a browser.  Dave added the following CORS config to the bucket:

```shell
$ gsutil cors get gs://natcap-urban-online-datasets-public
[{"maxAgeSeconds": 3600, "method": ["GET"], "origin": ["http://localhost:3000"], "responseHeader": ["Content-Type"]}]
```

## 2022-06-09

1. Created bucket natcap-urban-online-datasets-public that includes the global
   DEM at 250m resolution that we ship with the InVEST sample data.  The
   purpose of this is to test accessing Cloud-Optimized GeoTiffs from a
   browser.

## 2022-06-01

1. Created bucket natcap-urban-online-datasets with no special permissions
   (non-public data) for testing access to datasets via GDAL's virtual
   filesystem interfaces.  A few files have been uploaded for experimentation.

## 2022-02-15

1. Created the project NatCap-Urban-Online-Workflow.
2. Added software team to the project with "Owner" permissions.
2. Enabled the Compute Engine API.
3. Created a VM in zone us-central1-a, "server-1" as e2-medium.

        * VM runs debian:11 ("bullseye"), with balanced storage @ 50GB.
        * VM now has `docker.io` installed.
