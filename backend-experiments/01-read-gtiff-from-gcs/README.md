
* See https://gdal.org/user/virtual_file_systems.html#how-to-set-credentials
  for information about setting credentials.
* Credentials may be stored in a configuration file in GDAL 3.5+.
* In the GDAL API, credentials may be set via:
  * [`gdal.SetCredential`](https://github.com/OSGeo/gdal/blob/master/swig/python/osgeo/gdal.py#L1656)
  * Although there are C/C++ functions to load whole configuration files, this
    does not appear to be currently available in python.
* Note that random writes to a remote GCS bucket is not allowed except through
  a separate tempfile which is then copied over the top of the original file.
* When running this on a Google Cloud VM, it will automatically detect that it
  is running within a GCP VM and use the associated key.  This behavior can be
  forced by setting `CPL_MACHINE_IS_GCE=YES`, which is necessary if we have
  code running in a container with no access to the boot logs.
* Authentication types:
  * To authenticate as a user, use OAuth2.
    https://developers.google.com/workspace/guides/create-credentials#oauth-client-id
  * To authenticate as a service, use a service account.
    https://developers.google.com/workspace/guides/create-credentials#service-account
* For this experiment I just tried accessing the bucket from a VM in the same project.
  `gdal.Open('/vsigs/natcap-urban-online-datasets/dem.tif')` worked great, no
  extra config needed.

