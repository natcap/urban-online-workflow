#!/usr/bin/env sh
set -ex

# NOTE: this dataset was copied in to this CWD from google drive.  It's easier
# to download the whole directory through the browser than to do it
# programmatically here.
# I'm using this GDrive folder: https://drive.google.com/drive/u/0/folders/1r_THYeYEYDdweDrycO_iEzfdU8BWS8AA

NLCD=NLCD_2016_Land_Cover_L48_20190424.img

# GDAL needs these files to be available at specific filenames
# cp -n returns exit code of 1 when file exists.
cp -n NLCD_2016_Land_Cover_L48_20190424-001.ige NLCD_2016_Land_Cover_L48_20190424.ige || true
cp -n NLCD_2016_Land_Cover_L48_20190424-002.rde NLCD_2016_Land_Cover_L48_20190424.rde || true
WARPED_NLCD=NLCD_2016_epsg3857.tif.tmp
FINAL_NLCD=NLCD_2016_epsg3857.tif
gdalwarp \
    -t_srs "EPSG:3857" \
    -r near \
    -multi \
    -overwrite \
    -of "GTiff" \
    -co "BIGTIFF=YES" \
    -co "COMPRESS=DEFLATE" \
    -co "TILED=YES" \
    -co "NUM_THREADS=ALL_CPUS" \
    "$NLCD" "$WARPED_NLCD"

gdaladdo "$WARPED_NLCD"

gdal_translate \
    -of "COG" \
    -co "BIGTIFF=YES" \
    -co "COMPRESS=DEFLATE" \
    -co "LEVEL=9" \
    -co "NUM_THREADS=ALL_CPUS" \
    -co "ADD_ALPHA=YES" \
    "$WARPED_NLCD" "$FINAL_NLCD"

# Nonzero exit code if check fails.
python ./cog_validator/validate_cloud_optimized_geotiff.py --full-check=yes "$FINAL_NLCD"

gsutil cp "$FINAL_NLCD" "gs://natcap-urban-online-datasets-public/$FINAL_NLCD"

rm "$WARPED_NLCD"
