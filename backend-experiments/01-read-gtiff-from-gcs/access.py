import numpy
from osgeo import gdal

raster = gdal.Open('/vsigs/natcap-urban-online-datasets/dem.tif')
array = raster.ReadAsArray()
print(array.shape)
print(numpy.unique(array))
