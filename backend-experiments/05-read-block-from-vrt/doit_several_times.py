import time

from osgeo import gdal

raster = gdal.Open('nlud.vrt')

# From a gdalinfo call before this, I know the raster uses 256x256 blocks.
# Trying to read over the edges of a block to read in more info.
elapsed_sum = 0
for _ in range(5):
    start_time = time.time()
    block = raster.ReadAsArray(128, 128, 300, 300)
    elapsed = time.time() - start_time
    elapsed_sum += elapsed
    print(f'Elapsed: {elapsed}')

print(f'Mean elapsed time: {elapsed_sum / 5}')
