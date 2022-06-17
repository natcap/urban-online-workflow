from osgeo import gdal

raster = gdal.Open('/vsigs/natcap-urban-online-datasets/dem.tif')
print(raster.ReadAsArray())
