import logging
import os
import random
import time

from osgeo import gdal
from osgeo import ogr
from osgeo import osr

logging.basicConfig(level=logging.INFO)
SRS = osr.SpatialReference()
SRS.ImportFromEPSG(4326)
LOGGER = logging.getLogger(__name__)


def create_vector(target_filepath, n_random_features=10000000, options=[],
                  seed=time.time()):
    random.seed(seed)
    start_time = time.time()
    driver = gdal.GetDriverByName('FlatGeobuf')
    vector = driver.Create(
        target_filepath, 0, 0, 0, gdal.GDT_Unknown)
    layer = vector.CreateLayer(
        os.path.splitext(os.path.basename(target_filepath))[0],
        SRS, ogr.wkbPoint)

    layer_defn = layer.GetLayerDefn()
    last_log_time = time.time()
    layer.StartTransaction()
    for i in range(n_random_features):
        if i % 5000 and (time.time() - last_log_time) > 1.0:
            last_log_time = time.time()
            percent_complete = round((i / n_random_features) * 100, 2)
            LOGGER.info(
                f'Completed {i} of {n_random_features} ({percent_complete}%)')
        x = random.uniform(-180, 180)
        y = random.uniform(-90, 90)
        geom = ogr.CreateGeometryFromWkt(f'POINT ({x} {y})')
        feature = ogr.Feature(layer_defn)
        feature.SetGeometryDirectly(geom)
        layer.CreateFeature(feature)
    transact_start_time = time.time()
    layer.CommitTransaction()
    LOGGER.info(f'Transaction took {time.time() - transact_start_time}')

    flush_start_time = time.time()
    layer = None
    vector = None
    LOGGER.info(f'Flusing took {time.time() - flush_start_time:.4s}s')
    LOGGER.info(f'Created {target_filepath} in {time.time() - start_time}s')


if __name__ == '__main__':
    create_vector('random_global_points_NOSI.fgb',
                  options=[],
                  seed=1)
    create_vector('random_global_points_WSI.fgb',
                  options=['SPATIAL_INDEX=YES'],
                  seed=1)
