#!/usr/bin/env sh

set -ex

BUCKET=natcap-urban-online-datasets

# COMMENTING THIS BLOCK OUT BECAUSE IT TAKES A LONG TIME
# UNCOMMENT IF YOU DO WANT TO REBUILD
## Create FGB files and push to the bucket
#echo "Creating FGB files, ~1GB each"
#python create-flatgeobuf-randompoints.py
#gsutil cp ./*.fgb "gs://$BUCKET"
#ogr2ogr -f GPKG -progress random_global_points_WSI.gpkg random_global_points_WSI.fgb
#gsutil cp ./*.gpkg "gs://$BUCKET"

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


# Time local accesses for reference.
echo "\nTiming local file accesses (base case)"
for filename in ls *.gpkg
do
    /usr/bin/time --portability  python search-by-bounding-box.py "$filename"
done

# time remote access
echo "\nTiming access over the network"
for filename in ls *.gpkg
do
    /usr/bin/time --portability  python search-by-bounding-box.py "/vsigs/$BUCKET/$filename"
done

# Try out a VRT
echo "\nVRT access via VSIGS"
for filename in ls *.gpkg
do
    VRT="$filename.vt"
    gdalbuildvrt "$VRT" "/vsigs/$BUCKET/$filename"
    /usr/bin/time --portability  python search-by-bounding-box.py "$VRT"
done
