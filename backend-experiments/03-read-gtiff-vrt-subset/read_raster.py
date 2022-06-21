from osgeo import gdal
import numpy

raster = gdal.Open('output.vrt')
array = raster.ReadAsArray()
print(array)
print(array.shape)
print(numpy.unique(array))
