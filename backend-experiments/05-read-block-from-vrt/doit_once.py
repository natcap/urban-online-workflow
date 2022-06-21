import time

from osgeo import gdal

raster = gdal.Open('nlud.vrt')

# From a gdalinfo call before this, I know the raster uses 256x256 blocks.
# Trying to read over the edges of a block to read in more info.
start_time = time.time()
block = raster.ReadAsArray(128, 128, 300, 300)
print(f'Elapsed: {time.time() - start_time}')
