import argparse
import logging
import math
import os
import shutil
import tempfile
import textwrap
import time
import unittest

import numpy
import numpy.testing
import pygeoprocessing
import requests
import shapely.geometry
import shapely.wkt
from osgeo import gdal
from osgeo import ogr
from osgeo import osr

logging.basicConfig(level=logging.INFO)
LOGGER = logging.getLogger(__name__)

POLLING_INTERVAL_S = 1
DEFAULT_GTIFF_CREATION_TUPLE_OPTIONS = ('GTIFF', (
    'TILED=YES', 'BIGTIFF=YES', 'COMPRESS=LZW',
    'BLOCKXSIZE=256', 'BLOCKYSIZE=256'))
_WEB_MERCATOR_SRS = osr.SpatialReference()
_WEB_MERCATOR_SRS.ImportFromEPSG(3857)
_WEB_MERCATOR_SRS.SetAxisMappingStrategy(osr.OAMS_TRADITIONAL_GIS_ORDER)
_ALBERS_EQUAL_AREA_SRS = osr.SpatialReference()
NLUD_SRS_WKT = textwrap.dedent("""\
    PROJCRS["Albers_Conical_Equal_Area",
        BASEGEOGCRS["WGS 84",
            DATUM["World Geodetic System 1984",
                ELLIPSOID["WGS 84",6378137,298.257223563,
                    LENGTHUNIT["metre",1]]],
            PRIMEM["Greenwich",0,
                ANGLEUNIT["degree",0.0174532925199433]],
            ID["EPSG",4326]],
        CONVERSION["Albers Equal Area",
            METHOD["Albers Equal Area",
                ID["EPSG",9822]],
            PARAMETER["Latitude of false origin",23,
                ANGLEUNIT["degree",0.0174532925199433],
                ID["EPSG",8821]],
            PARAMETER["Longitude of false origin",-96,
                ANGLEUNIT["degree",0.0174532925199433],
                ID["EPSG",8822]],
            PARAMETER["Latitude of 1st standard parallel",29.5,
                ANGLEUNIT["degree",0.0174532925199433],
                ID["EPSG",8823]],
            PARAMETER["Latitude of 2nd standard parallel",45.5,
                ANGLEUNIT["degree",0.0174532925199433],
                ID["EPSG",8824]],
            PARAMETER["Easting at false origin",0,
                LENGTHUNIT["metre",1],
                ID["EPSG",8826]],
            PARAMETER["Northing at false origin",0,
                LENGTHUNIT["metre",1],
                ID["EPSG",8827]]],
        CS[Cartesian,2],
            AXIS["easting",east,
                ORDER[1],
                LENGTHUNIT["metre",1,
                    ID["EPSG",9001]]],
            AXIS["northing",north,
                ORDER[2],
                LENGTHUNIT["metre",1,
                    ID["EPSG",9001]]]]""")
_ALBERS_EQUAL_AREA_SRS.ImportFromWkt(NLUD_SRS_WKT)
_ALBERS_EQUAL_AREA_SRS.SetAxisMappingStrategy(osr.OAMS_TRADITIONAL_GIS_ORDER)
WEB_MERCATOR_TO_ALBERS_EQ_AREA = osr.CreateCoordinateTransformation(
    _WEB_MERCATOR_SRS, _ALBERS_EQUAL_AREA_SRS)
ALBERS_EQ_AREA_TO_WEB_MERCATOR = osr.CreateCoordinateTransformation(
    _ALBERS_EQUAL_AREA_SRS, _WEB_MERCATOR_SRS)

# NLUD raster attributes copied in by hand from gdalinfo
ORIGIN_X = -2356095.0
ORIGIN_Y = 3172635.0
PIXELSIZE_X = 30.0
PIXELSIZE_Y = -30.0


class Tests(unittest.TestCase):
    def setUp(self):
        self.workspace_dir = tempfile.mkdtemp()

    def tearDown(self):
        shutil.rmtree(self.workspace_dir)

    def test_new_lulc(self):
        gtiff_path = os.path.join(self.workspace_dir, 'raster.tif')

        # University of Texas: San Antonio, selected by hand in QGIS
        # Coordinates are in EPSG:3857 "Web Mercator"
        point_over_san_antonio = shapely.geometry.Point(
            -10965275.57, 3429693.30)

        # Raster units are in meters (mercator)
        parcel = point_over_san_antonio.buffer(100)
        pygeoprocessing.geoprocessing.shapely_geometry_to_vector(
            [point_over_san_antonio, parcel], os.path.join(self.workspace_dir, 'parcel.shp'),
            _WEB_MERCATOR_SRS.ExportToWkt(), 'ESRI Shapefile')

        _create_new_lulc(parcel.wkt, gtiff_path)

        raster_info = pygeoprocessing.get_raster_info(gtiff_path)

        raster_bbox = shapely.geometry.box(*raster_info['bounding_box'])
        epsg3857_raster_bbox = ogr.CreateGeometryFromWkt(raster_bbox.wkt)
        epsg3857_raster_bbox.Transform(ALBERS_EQ_AREA_TO_WEB_MERCATOR)
        epsg3857_raster_bbox_shapely = shapely.wkt.loads(
            epsg3857_raster_bbox.ExportToWkt())

        self.assertTrue(epsg3857_raster_bbox_shapely.contains(parcel))


    def test_fill(self):
        # University of Texas: San Antonio, selected by hand in QGIS
        # Coordinates are in EPSG:3857 "Web Mercator"
        point_over_san_antonio = shapely.geometry.Point(
            -10965275.57, 3429693.30)
        parcel = point_over_san_antonio.buffer(100)

        target_raster_path = os.path.join(self.workspace_dir, 'raster.tif')
        fill(parcel.wkt, 15, target_raster_path)

        result_array = pygeoprocessing.raster_to_numpy_array(
                target_raster_path)
        self.assertEqual(
            numpy.sum(result_array[result_array != 255]), 600)
        self.assertEqual(numpy.sum(result_array == 15), 40)


def _reproject_to_nlud(parcel_wkt_epsg3857):
    ogr_geom = ogr.CreateGeometryFromWkt(parcel_wkt_epsg3857)
    err_code = ogr_geom.Transform(WEB_MERCATOR_TO_ALBERS_EQ_AREA)
    if err_code:
        LOGGER.warning(
            "Transformation failed on parcel; continuing with "
            f"{parcel_wkt_epsg3857}")
    assert ogr_geom.ExportToWkt() != parcel_wkt_epsg3857
    parcel_geom = shapely.wkt.loads(ogr_geom.ExportToWkt())
    return parcel_geom


def _create_new_lulc(parcel_wkt_epsg3857, target_local_gtiff_path):
    """Create an LULC raster in the NLUD projection covering the parcel.

    Args:
        parcel_wkt_epsg3857 (str): The parcel WKT in EPSG:3857 (Web Mercator)
        target_local_gtiff_path (str): Where the target raster should be saved

    Returns:
        ``None``
    """
    parcel_geom = _reproject_to_nlud(parcel_wkt_epsg3857)
    parcel_min_x, parcel_min_y, parcel_max_x, parcel_max_y = parcel_geom.bounds
    buffered_parcel_geom = parcel_geom.buffer(
        abs(min(parcel_max_x - parcel_min_x,
                parcel_max_y - parcel_min_y)))
    buf_minx, buf_miny, buf_maxx, buf_maxy = buffered_parcel_geom.bounds

    buf_minx -= abs(buf_minx % PIXELSIZE_X)
    buf_miny -= abs(buf_miny % PIXELSIZE_Y)
    buf_maxx += PIXELSIZE_X - abs(buf_maxx % PIXELSIZE_X)
    buf_maxy += PIXELSIZE_Y - abs(buf_maxy % PIXELSIZE_Y)

    n_cols = abs(int(math.ceil((buf_maxx - buf_minx) / PIXELSIZE_X)))
    n_rows = abs(int(math.ceil((buf_maxy - buf_miny) / PIXELSIZE_Y)))

    raster_driver = gdal.GetDriverByName('GTIFF')
    target_raster = raster_driver.Create(
        target_local_gtiff_path, n_cols, n_rows, 1, gdal.GDT_Byte,
        options=DEFAULT_GTIFF_CREATION_TUPLE_OPTIONS[1])
    target_raster.SetProjection(NLUD_SRS_WKT)
    target_raster.SetGeoTransform(
        [buf_minx, PIXELSIZE_X, 0, buf_maxy, 0, PIXELSIZE_Y])
    band = target_raster.GetRasterBand(1)
    band.SetNoDataValue(255)
    band.Fill(255)
    target_raster = None


def fill(parcel_wkt_epsg3857, fill_lulc_class, target_lulc_path):
    parcel_geom = _reproject_to_nlud(parcel_wkt_epsg3857)
    working_dir = tempfile.mkdtemp()

    parcel_vector_path = os.path.join(working_dir, 'parcel.fgb')
    pygeoprocessing.geoprocessing.shapely_geometry_to_vector(
        [parcel_geom], parcel_vector_path, NLUD_SRS_WKT, 'FlatGeoBuf')

    _create_new_lulc(parcel_wkt_epsg3857, target_lulc_path)
    pygeoprocessing.geoprocessing.rasterize(
        parcel_vector_path, target_lulc_path, [fill_lulc_class],
        option_list=['ALL_TOUCHED=TRUE'])


def wallpaper():
    # TODO: For AOI: buffer the source polygon by a lot and take bbox
    pass


def do_work(ip, port):
    LOGGER.info(f'Starting worker, queueing {ip}:{port}')
    LOGGER.info(f'Polling the queue every {POLLING_INTERVAL_S}s if no work')
    while True:
        response = requests.get(f'{ip}:{port}/jobsqueue/')
        if not response.json:
            time.sleep(POLLING_INTERVAL_S)
            continue

        server_args = response.json['server-attrs']
        job_type = response.json['job']
        job_args = response.json['args']

        if job_type == 'fill':
            fill(wkt=job_args['wkt'], pattern_id=server_args['pattern_id'])
        else:
            # post an update back to server - could not compute, invalid job
            # name.
            # USE JOB_TYPE AS ENDPOINT
            requests.post()


        #response = requests.get(f'{ip}/jobsqueue/:{port}')
        # jobname (function to call)
        # the args for the function
        # Assume that we're cropping the landcover to the federal HUD metro
        # area that matches
        #  - [ ] get the federal HUD metro areas vector


def main():
    parser = argparse.ArgumentParser(
        __name__, description=('Worker for Urban Online Workflow'))
    parser.add_argument('queue_ip')
    parser.add_argument('queue_port')

    args = parser.parse_args()
    do_work(
        ip=args.queue_ip,
        port=args.queue_port
    )


if __name__ == '__main__':
    main()
