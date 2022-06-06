#!/usr/bin/env sh

set -ex

BUCKET=natcap-urban-online-datasets

# Create FGB files and push to the bucket
echo "Creating FGB files, ~1GB each"
python create-flatgeobuf-randompoints.py
gsutil cp ./*.fgb "gs://$BUCKET"

# Time local accesses for reference.
echo "\nTiming local file accesses (base case)"
for filename in ls *.fgb
do
    /usr/bin/time --portability  python search-by-bounding-box.py "$filename"
done

# time remote access
echo "\nTiming access over the network"
for filename in ls *.fgb
do
    /usr/bin/time --portability  python search-by-bounding-box.py "/vsigs/$BUCKET/$filename"
done

# Try out a VRT
echo "\nVRT access via VSIGS"
for filename in ls *.fgb
do
    VRT="$filename.vt"
    gdalbuildvrt "$VRT" "/vsigs/$BUCKET/$filename"
    /usr/bin/time --portability  python search-by-bounding-box.py "$VRT"
done




