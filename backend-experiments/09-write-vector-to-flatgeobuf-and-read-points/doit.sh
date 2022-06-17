#!/usr/bin/env sh

set -ex

BUCKET=natcap-urban-online-datasets

# COMMENTING THIS BLOCK OUT BECAUSE IT TAKES A LONG TIME
# UNCOMMENT IF YOU DO WANT TO REBUILD
## Create FGB files and push to the bucket
#echo "Creating FGB files, ~1GB each"
#python create-flatgeobuf-randompoints.py
#ogr2ogr -f GPKG -progress random_global_points_WSI.gpkg random_global_points_WSI.fgb
## NOTE: gsutil requires appropriate write permissions to the bucket.
## NOTE: The default compute engine service account cannot write to buckets.
## NOTE: A possible workaround is to log in to the VM with your personal email.
## NOTE: To do this, `gcloud auth login "my_email@gmail.com"`.
#gsutil cp ./*.fgb "gs://$BUCKET"
#gsutil cp ./*.gpkg "gs://$BUCKET"

# Time local accesses for reference.
echo "\nTiming local file accesses (base case)"
for filename in *.fgb
do
    /usr/bin/time --portability  python search-by-bounding-box.py "$filename"
done

# time remote access
echo "\nTiming access over the network"
for filename in *.fgb
do
    /usr/bin/time --portability  python search-by-bounding-box.py "/vsigs/$BUCKET/$filename"
    /usr/bin/time --portability  python search-by-bounding-box.py "/vsigs/$BUCKET/$filename" --noverify
done

## Try out a VRT
## gdalbuildvrt only supports rasters despite VRT being a supported vector
## format.
#echo "\nVRT access via VSIGS"
#for filename in *.fgb
#do
#    VRT="$filename.vt"
#    gdalbuildvrt "$VRT" "/vsigs/$BUCKET/$filename"
#    /usr/bin/time --portability  python search-by-bounding-box.py "$VRT"
#done


# Time local accesses for reference.
echo "\nTiming local file accesses (base case)"
for filename in *.gpkg
do
    /usr/bin/time --portability  python search-by-bounding-box.py "$filename"
done

# time remote access
echo "\nTiming access over the network"
for filename in *.gpkg
do
    /usr/bin/time --portability  python search-by-bounding-box.py "/vsigs/$BUCKET/$filename"
done

## Try out a VRT
## VRTs are a supported vector format, but not apparently supported by
## gdalbuildvrt.
#echo "\nVRT access via VSIGS"
#for filename in *.gpkg
#do
#    VRT="$filename.vt"
#    gdalbuildvrt "$VRT" "/vsigs/$BUCKET/$filename"
#    /usr/bin/time --portability  python search-by-bounding-box.py "$VRT"
#done
