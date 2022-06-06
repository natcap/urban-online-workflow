import os
import sys
import time

import shapely.geometry
from osgeo import gdal
from osgeo import ogr

bounding_box = ogr.CreateGeometryFromWkt(
    shapely.geometry.box(-40, -40, 40, 40).wkt)

latitude_sum = 0
longitude_sum = 0

vector_path = sys.argv[1]
try:
    if sys.argv[2] == '--noverify':
        open_options = ['VERIFY_BUFFERS=NO']
except IndexError:
    open_options = ['VERIFY_BUFFERS=YES']  # default, but making explicit

vector = gdal.OpenEx(vector_path, open_options=open_options)
basename = os.path.splitext(os.path.basename(vector_path))[0]
n_features = 0

start_time = time.time()
for feature in vector.ExecuteSQL(f"SELECT * FROM {basename}",
                                 spatialFilter=bounding_box):
    n_features += 1
    point_geom = feature.GetGeometryRef()
    latitude_sum += point_geom.GetX()
    longitude_sum += point_geom.GetY()

print(f"Finished in {time.time() - start_time:.2f}s")
print(f"N points found in bbox: {n_features}")
print(f"Mean lat: {(latitude_sum/n_features):.6f}, mean lon: "
      f"{(longitude_sum/n_features):.6f}")
