#!/usr/bin/env sh
set -ex

ENV=./env39
if [ ! -d "$ENV" ]
then
    mamba create -p $ENV -c conda-forge -y "python=3.8" "gdal"
fi
BIN="$ENV/bin"

# NOTE: this dataset was copied in to this CWD from google drive.  It's easier
# to download the whole directory through the browser than to do it
# programmatically here.
# I'm using this GDrive folder: https://drive.google.com/drive/u/0/folders/1r_THYeYEYDdweDrycO_iEzfdU8BWS8AA

NLCD=NLCD_2016_Land_Cover_L48_20190424.img

# GDAL needs these files to be available at specific filenames
# cp -n returns exit code of 1 when file exists.
cp -n NLCD_2016_Land_Cover_L48_20190424-001.ige NLCD_2016_Land_Cover_L48_20190424.ige || true
cp -n NLCD_2016_Land_Cover_L48_20190424-002.rde NLCD_2016_Land_Cover_L48_20190424.rde || true

FINAL_NLCD=NLCD_2016.tif
$BIN/gdal_translate \
    -of "COG" \
    -co "BIGTIFF=YES" \
    -co "COMPRESS=DEFLATE" \
    -co "LEVEL=9" \
    -co "NUM_THREADS=ALL_CPUS" \
    -co "ADD_ALPHA=YES" \
    "$NLCD" "$FINAL_NLCD"
$BIN/gdaladdo "$FINAL_NLCD"
