1. `gdalbuildvrt output.vrt /vsigs/natcap-urban-online-datasets/dem.tif`
   * Note that GDAL must be able to read the raster in order to create the VRT,
     so be logged in or else on a GCP VM.
2. `python read_raster.py` as a demo that we can read the raster.
