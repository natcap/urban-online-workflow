set -e

# import gdal binaries in advance
python -c "from osgeo import gdal"

echo "Download a GTIFF and read a block."
/usr/bin/time --portability gsutil cp gs://natcap-urban-online-datasets/nlud.tif .
/usr/bin/time --portability python readblock.py ./nlud.tif

echo "Make a VRT with VSIGS and read a block from it"
/usr/bin/time --portability gdalbuildvrt -overwrite nlud.vrt /vsigs/natcap-urban-online-datasets/nlud.tif
/usr/bin/time --portability python readblock.py nlud.vrt

echo "Make a VRT for local GTIFF and read a block from it"
/usr/bin/time --portability gdalbuildvrt -overwrite nlud-local.vrt ./nlud.tif
/usr/bin/time --portability python readblock.py nlud-local.vrt

echo "Read a block from VSIGS"
/usr/bin/time --portability python readblock.py "/vsigs/natcap-urban-online-datasets/nlud.tif"
