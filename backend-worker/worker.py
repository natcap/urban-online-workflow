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
NLUD_NODATA = -1
NLUD_DTYPE = gdal.GDT_UInt16
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
NLUD_ORIGIN_X = -2356095.0
NLUD_ORIGIN_Y = 3172635.0
PIXELSIZE_X = 30.0
PIXELSIZE_Y = -30.0

STATUS_SUCCESS = 'success'
STATUS_FAILURE = 'failed'
JOBTYPE_FILL = 'parcel_fill'
JOBTYPE_WALLPAPER = 'wallpaper'
JOBTYPE_PARCEL_STATS = 'stats_under_parcel'


class Tests(unittest.TestCase):
    def setUp(self):
        self.workspace_dir = tempfile.mkdtemp()

    def tearDown(self):
        shutil.rmtree(self.workspace_dir)

    def test_pixelcounts_under_parcel(self):
        # University of Texas: San Antonio, selected by hand in QGIS
        # Coordinates are in EPSG:3857 "Web Mercator"
        point_over_san_antonio = shapely.geometry.Point(
            -10965275.57, 3429693.30)
        parcel = point_over_san_antonio.buffer(100)

        pygeoprocessing.geoprocessing.shapely_geometry_to_vector(
            [point_over_san_antonio, parcel],
            os.path.join(self.workspace_dir, 'parcel.fgb'),
            _WEB_MERCATOR_SRS.ExportToWkt(), 'FlatGeoBuf')

        nlud_path = 'appdata/nlud.tif'
        pixelcounts = pixelcounts_under_parcel(
            parcel.wkt, nlud_path)

        expected_values = {
            262: 0.9756,
            321: 0.0244,
        }
        self.assertEqual(pixelcounts, expected_values)

    def test_new_lulc(self):
        gtiff_path = os.path.join(self.workspace_dir, 'raster.tif')

        # University of Texas: San Antonio, selected by hand in QGIS
        # Coordinates are in EPSG:3857 "Web Mercator"
        point_over_san_antonio = shapely.geometry.Point(
            -10965275.57, 3429693.30)

        # Raster units are in meters (mercator)
        parcel = point_over_san_antonio.buffer(100)
        pygeoprocessing.geoprocessing.shapely_geometry_to_vector(
            [point_over_san_antonio, parcel],
            os.path.join(self.workspace_dir, 'parcel.shp'),
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
        fill_parcel(parcel.wkt, 15, target_raster_path)

        result_array = pygeoprocessing.raster_to_numpy_array(
                target_raster_path)
        self.assertEqual(
            numpy.sum(result_array[result_array != NLUD_NODATA]), 600)
        self.assertEqual(numpy.sum(result_array == 15), 40)

    def test_wallpaper(self):
        # University of Texas: San Antonio, selected by hand in QGIS
        # Coordinates are in EPSG:3857 "Web Mercator"
        point_over_san_antonio = shapely.geometry.Point(
            -10965275.57, 3429693.30)
        parcel = point_over_san_antonio.buffer(100)

        # Apache Creek, urban residential area, San Antonio, TX.
        # Selected by hand in QGIS.  Coordinates are in EPSG:3857 "Web
        # Mercator"
        pattern = shapely.geometry.box(
            *shapely.geometry.Point(
                -10968418.16, 3429347.98).buffer(100).bounds)

        target_raster_path = os.path.join(
            self.workspace_dir, 'wallpapered_raster.tif')

        nlud_path = 'appdata/nlud.tif'
        wallpaper_parcel(parcel.wkt, pattern.wkt, nlud_path,
                         target_raster_path, self.workspace_dir)

        # This is useful for debugging
        # import pdb; pdb.set_trace()  # print(self.workspace_dir)


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

    buf_minx -= abs((buf_minx - NLUD_ORIGIN_X) % PIXELSIZE_X)
    buf_miny -= abs((buf_miny - NLUD_ORIGIN_Y) % PIXELSIZE_Y)
    buf_maxx += PIXELSIZE_X - abs((buf_maxx - NLUD_ORIGIN_X) % PIXELSIZE_X)
    buf_maxy += PIXELSIZE_Y - abs((buf_maxy - NLUD_ORIGIN_Y) % PIXELSIZE_Y)

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
    band.SetNoDataValue(NLUD_NODATA)
    band.Fill(NLUD_NODATA)
    target_raster = None


def fill_parcel(parcel_wkt_epsg3857, fill_lulc_class,
                target_lulc_path, working_dir=None):
    """Fill (rasterize) a parcel with a landcover code.

    Args:
        parcel_wkt_epsg3857 (str): The WKT of the parcel to fill,
            projected in EPSG:3857 (Web Mercator)
        fill_lulc_class (int): The lulc class to fill the parcel with.
        target_lulc_path (str): Where the target lulc raster should be saved.
        working_dir (str): The path to where working files should be stored.
            If ``None``, then the default temp dir will be used.

    Returns:
        ``None``
    """
    parcel_geom = _reproject_to_nlud(parcel_wkt_epsg3857)
    working_dir = tempfile.mkdtemp(prefix='fill-parcel-', dir=working_dir)

    parcel_vector_path = os.path.join(working_dir, 'parcel.fgb')
    pygeoprocessing.geoprocessing.shapely_geometry_to_vector(
        [parcel_geom], parcel_vector_path, NLUD_SRS_WKT, 'FlatGeoBuf')

    _create_new_lulc(parcel_wkt_epsg3857, target_lulc_path)
    pygeoprocessing.geoprocessing.rasterize(
        parcel_vector_path, target_lulc_path, [fill_lulc_class],
        option_list=['ALL_TOUCHED=TRUE'])

    shutil.rmtree(working_dir)


def wallpaper_parcel(parcel_wkt_epsg3857, pattern_wkt_epsg3857,
                     source_nlud_raster_path, target_raster_path,
                     working_dir=None):
    """Wallpaper a region.

    This function is adapted from
    https://github.com/natcap/wallpaper-scenarios/blob/main/wallpaper_raster.py#L100

    Args:
        parcel_wkt_epsg3857 (str): The WKT of the parcel to wallpaper over,
            projrected in EPSG:3857 (Web Mercator)
        pattern_wkt_epsg3857 (str): The WKT of the pattern geometry, projected
            in EPSG:3857 (Web Mercator)
        source_nlud_raster_path (str): The GDAL-compatible URI to the source
            NLUD raster, projected in Albers Equal Area.
        target_raster_path (str): Where the output raster should be written on
            disk.
        working_dir (str): Where temporary files should be stored.  If
            ``None``, then the default temp dir will be used.

    Returns:
        ``None``
    """
    nlud_raster_info = pygeoprocessing.geoprocessing.get_raster_info(
        source_nlud_raster_path)

    working_dir = tempfile.mkdtemp(prefix='wallpaper-parcel-', dir=working_dir)
    parcel_mask_raster_path = os.path.join(working_dir, 'mask.tif')
    fill_parcel(parcel_wkt_epsg3857, 1, parcel_mask_raster_path)
    parcel_raster_info = pygeoprocessing.get_raster_info(
        parcel_mask_raster_path)
    parcel_mask_raster = gdal.OpenEx(parcel_mask_raster_path, gdal.OF_RASTER)
    parcel_mask_band = parcel_mask_raster.GetRasterBand(1)

    nlud_under_parcel_path = os.path.join(working_dir, 'nlud_under_parcel.tif')
    pygeoprocessing.geoprocessing.warp_raster(
        source_nlud_raster_path, nlud_raster_info['pixel_size'],
        nlud_under_parcel_path, 'nearest',
        target_bb=parcel_raster_info['bounding_box'])
    nlud_under_parcel_raster_info = pygeoprocessing.get_raster_info(
        nlud_under_parcel_path)

    nlud_under_pattern_path = os.path.join(
        working_dir, 'nlud_under_pattern.tif')
    pattern_bbox = _reproject_to_nlud(pattern_wkt_epsg3857).bounds
    pygeoprocessing.geoprocessing.warp_raster(
        source_nlud_raster_path, nlud_raster_info['pixel_size'],
        nlud_under_pattern_path, 'nearest',
        target_bb=pattern_bbox)
    wallpaper_array = pygeoprocessing.raster_to_numpy_array(
        nlud_under_pattern_path)

    # Sanity check to catch programmer error early
    for attr in ('raster_size', 'pixel_size', 'bounding_box'):
        assert nlud_under_parcel_raster_info[attr] == parcel_raster_info[attr]

    pygeoprocessing.new_raster_from_base(
        parcel_mask_raster_path, target_raster_path,
        NLUD_DTYPE, [NLUD_NODATA])
    target_raster = gdal.OpenEx(
        target_raster_path, gdal.OF_RASTER | gdal.GA_Update)
    target_band = target_raster.GetRasterBand(1)

    for offset_dict, base_array in pygeoprocessing.iterblocks(
            (nlud_under_parcel_path, 1)):
        parcel_mask_array = parcel_mask_band.ReadAsArray(**offset_dict)
        assert parcel_mask_array is not None

        xoff = offset_dict['xoff']
        yoff = offset_dict['yoff']

        wallpaper_x = xoff % wallpaper_array.shape[1]
        wallpaper_y = yoff % wallpaper_array.shape[0]

        win_ysize = offset_dict['win_ysize']
        win_xsize = offset_dict['win_xsize']
        wallpaper_x_repeats = (
            1 + ((wallpaper_x+win_xsize) // wallpaper_array.shape[1]))
        wallpaper_y_repeats = (
            1 + ((wallpaper_y+win_ysize) // wallpaper_array.shape[0]))
        wallpaper_tiled = numpy.tile(
            wallpaper_array,
            (wallpaper_y_repeats, wallpaper_x_repeats))[
            wallpaper_y:wallpaper_y+win_ysize,
            wallpaper_x:wallpaper_x+win_xsize]

        target_array = numpy.where(
            parcel_mask_array == 1,
            wallpaper_tiled,
            base_array)

        target_band.WriteArray(target_array, xoff=xoff, yoff=yoff)

    target_raster.BuildOverviews()  # default settings for overviews

    shutil.rmtree(working_dir)


def pixelcounts_under_parcel(parcel_wkt_epsg3857, source_raster_path):
    if source_raster_path.startswith(('https', 'http')):
        source_raster_path = f'/vsicurl/{source_raster_path}'
    source_raster = gdal.OpenEx(source_raster_path,
                                gdal.GA_ReadOnly | gdal.OF_RASTER)
    source_band = source_raster.GetRasterBand(1)
    geotransform = source_raster.GetGeoTransform()
    inv_geotransform = gdal.InvGeoTransform(geotransform)

    parcel = _reproject_to_nlud(parcel_wkt_epsg3857)
    # Convert lon/lat degrees to x/y pixel for the dataset
    minx, miny, maxx, maxy = parcel.bounds
    _x0, _y0 = gdal.ApplyGeoTransform(inv_geotransform, minx, miny)
    _x1, _y1 = gdal.ApplyGeoTransform(inv_geotransform, maxx, maxy)
    x0, y0 = min(_x0, _x1), min(_y0, _y1)
    x1, y1 = max(_x0, _x1), max(_y0, _y1)

    pygeoprocessing.geoprocessing.shapely_geometry_to_vector(
        [parcel],
        os.path.join('parcel_loaded.fgb'),
        _WEB_MERCATOR_SRS.ExportToWkt(), 'FlatGeoBuf')

    # "Round up" to the next pixel
    x0 = math.floor(x0)
    y0 = math.floor(y0)
    x1 = math.ceil(x1)
    y1 = math.ceil(y1)
    array = source_band.ReadAsArray(
        int(x0), int(y0), int(x1-x0), int(y1-y0))

    # create a new in-memory dataset filled with 0
    gdal_driver = gdal.GetDriverByName('MEM')
    target_raster = gdal_driver.Create(
        '', array.shape[1], array.shape[0], 1, gdal.GDT_Byte)
    target_raster.SetProjection(NLUD_SRS_WKT)
    target_origin_x, target_origin_y = gdal.ApplyGeoTransform(
        geotransform, x0, y0)
    target_raster.SetGeoTransform(
        [target_origin_x, PIXELSIZE_X, 0.0, target_origin_y, 0.0, PIXELSIZE_Y])
    target_band = target_raster.GetRasterBand(1)
    target_band.Fill(0)

    vector_driver = ogr.GetDriverByName('MEMORY')
    vector = vector_driver.CreateDataSource('parcel')
    parcel_layer = vector.CreateLayer(
        'parcel_layer', _ALBERS_EQUAL_AREA_SRS, ogr.wkbPolygon)
    parcel_layer.StartTransaction()
    feature = ogr.Feature(parcel_layer.GetLayerDefn())
    feature.SetGeometry(ogr.CreateGeometryFromWkt(parcel.wkt))
    parcel_layer.CreateFeature(feature)
    parcel_layer.CommitTransaction()

    gdal.RasterizeLayer(
        target_raster, [1], parcel_layer,
        options=['ALL_TOUCHED=TRUE'], burn_values=[1])

    parcel_mask = target_band.ReadAsArray()
    assert parcel_mask.shape == array.shape
    values_under_parcel, counts = numpy.unique(
        array[parcel_mask == 1], return_counts=True)

    return_values = {}
    n_values_under_parcel = numpy.sum(counts)
    for lulc_code, pixel_count in zip(values_under_parcel, counts):
        return_values[lulc_code] = round(
            pixel_count / n_values_under_parcel, 4)

    return return_values


def do_work(ip, port):
    local_appdata_dir = 'appdata'
    job_queue_url = f'{ip}:{port}/jobsqueue/'
    LOGGER.info(f'Starting worker, queueing {job_queue_url}')
    LOGGER.info(f'Polling the queue every {POLLING_INTERVAL_S}s if no work')
    while True:
        response = requests.get(job_queue_url)
        if not response.json:
            time.sleep(POLLING_INTERVAL_S)
            continue

        server_args = response.json['server-attrs']
        job_type = response.json['job_type']
        job_args = response.json['job_args']

        try:
            if job_type in {JOBTYPE_FILL, JOBTYPE_WALLPAPER}:
                if job_type == 'parcel_fill':
                    fill_workspace = tempfile.mkdtemp(
                        prefix='fill-', dir=local_appdata_dir)
                    result_path = f'{fill_workspace}/filled.tif'
                    fill_parcel(
                        parcel_wkt_epsg3857=job_args['target_parcel_wkt'],
                        fill_lulc_class=job_args['lulc_class'],
                        source_nlud_raster_path=job_args['lulc_source_url'],
                        target_lulc_path=result_path
                    )
                elif job_type == 'wallpaper':
                    wallpaper_workspace = tempfile.mkdtemp(
                        prefix='wallpaper-', dir=local_appdata_dir)
                    result_path = f'{wallpaper_workspace}/wallpaper.tif'
                    wallpaper_parcel(
                        parcel_wkt_epsg3857=job_args['target_parcel_wkt'],
                        pattern_wkt_epsg3857=job_args['pattern_bbox_wkt'],
                        #source_nlud_raster_path=f'{local_appdata_dir}/nlud.tif',
                        source_nlud_raster_path=job_args['lulc_source_url'],
                        target_raster_path=result_path,
                        working_dir=wallpaper_workspace
                    )
                data = {
                    'result': {
                        'lulc_path': result_path,
                        'lulc_stats': {
                            'base': pixelcounts_under_parcel(
                                job_args['target_parcel_wkt'],
                                job_args['lulc_source_url']
                            ),
                            'result': pixelcounts_under_parcel(
                                job_args['target_parcel_wkt'],
                                result_path
                            ),
                        }
                    },
                }
            elif job_type == 'stats_under_parcel':
                pass
            else:
                raise ValueError(f"Invalid job type: {job_type}")
            status = STATUS_SUCCESS
        except Exception as error:
            LOGGER.exception(f'{job_type} failed: {error}')
            status = STATUS_FAILURE
            result_path = None
            data = {}  # data doesn't matter in a failure
        finally:
            if job_type in set(['parcel_fill', 'wallpaper']):
                target_endpoint = 'scenario'
            else:
                target_endpoint = 'invest_run'

            data['server_attrs'] = server_args
            data['status'] = status
            requests.post(
                f'{job_queue_url}/{target_endpoint}',
                data=data
            )


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
