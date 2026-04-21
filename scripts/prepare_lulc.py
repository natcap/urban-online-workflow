"""LULC rasters from Chris need some processing to be ready for a webmap.

1. warp to web-mercator
2. build overviews
"""

import os

import pygeoprocessing
from osgeo import osr

shared_drive = 'H:/Shared drives/Online Urban ES Modeling Tool/Data from Chris/LULC and Parameters August 2024'
base_raster_path = os.path.join(shared_drive, 'lulc_overlay_3857.tif')
target_raster_path = '../appdata/lulc_overlay_3857.tif'

base_info = pygeoprocessing.get_raster_info(base_raster_path)
print(base_info)

srs = osr.SpatialReference()
srs.ImportFromEPSG(3857)
target_proj_wkt = srs.ExportToWkt()

# even if we don't need to reproject, this has benefit
# of adding compression.
pygeoprocessing.warp_raster(
    base_raster_path=base_raster_path,
    target_pixel_size=base_info['pixel_size'],
    target_raster_path=target_raster_path,
    resample_method='near',
    target_projection_wkt=target_proj_wkt)

pygeoprocessing.build_overviews(
    target_raster_path, internal=True, resample_method='near',
    overwrite=True, levels='auto')
