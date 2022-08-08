import argparse
import json
import logging
import math
import os
import shutil
import tempfile
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
NLCD_NODATA = -1
NLCD_DTYPE = gdal.GDT_UInt16
_WEB_MERCATOR_SRS = osr.SpatialReference()
_WEB_MERCATOR_SRS.ImportFromEPSG(3857)
_WEB_MERCATOR_SRS.SetAxisMappingStrategy(osr.OAMS_TRADITIONAL_GIS_ORDER)
_ALBERS_EQUAL_AREA_SRS = osr.SpatialReference()

NLCD_RASTER_PATHS = {
    'vsigs': '/vsigs/natcap-urban-online-datasets/NLCD_2016.tif',
    'docker': '/opt/appdata/NLCD_2016.tif',
    'local': os.path.join(os.path.dirname(__file__), '..', 'appdata',
                          'NLCD_2016.tif')
}
_NLCD_RASTER_INFO = None
for NLCD_RASTER_PATH in NLCD_RASTER_PATHS.values():
    try:
        _NLCD_RASTER_INFO = pygeoprocessing.get_raster_info(NLCD_RASTER_PATH)
    except ValueError:
        LOGGER.info(f"Could not open raster path {NLCD_RASTER_PATH}")
if _NLCD_RASTER_INFO is None:
    raise AssertionError("Could not open NLCD_2016.tif at any known locations")
LOGGER.info(f"Using NLCD at {NLCD_RASTER_PATH}")

NLCD_SRS_WKT = _NLCD_RASTER_INFO['projection_wkt']
_ALBERS_EQUAL_AREA_SRS.ImportFromWkt(NLCD_SRS_WKT)
_ALBERS_EQUAL_AREA_SRS.SetAxisMappingStrategy(osr.OAMS_TRADITIONAL_GIS_ORDER)
WEB_MERCATOR_TO_ALBERS_EQ_AREA = osr.CreateCoordinateTransformation(
    _WEB_MERCATOR_SRS, _ALBERS_EQUAL_AREA_SRS)
ALBERS_EQ_AREA_TO_WEB_MERCATOR = osr.CreateCoordinateTransformation(
    _ALBERS_EQUAL_AREA_SRS, _WEB_MERCATOR_SRS)

# NLCD raster attributes copied in by hand from gdalinfo
NLCD_ORIGIN_X, _, _, NLCD_ORIGIN_Y, _, _ = _NLCD_RASTER_INFO['geotransform']
PIXELSIZE_X, PIXELSIZE_Y = _NLCD_RASTER_INFO['pixel_size']

STATUS_SUCCESS = 'success'
STATUS_FAILURE = 'failed'
JOBTYPE_FILL = 'parcel_fill'
JOBTYPE_WALLPAPER = 'wallpaper'
JOBTYPE_PARCEL_STATS = 'stats_under_parcel'
JOBTYPE_LULC_CLASSNAMES = 'raster_classnames'
ENDPOINTS = {
    JOBTYPE_FILL: 'scenario',
    JOBTYPE_WALLPAPER: 'scenario',
    JOBTYPE_PARCEL_STATS: 'parcel_stats',
    JOBTYPE_LULC_CLASSNAMES: 'raster_classnames',  # TODO: fixme!
}


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
            262: 40,
            321: 1,
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
            numpy.sum(result_array[result_array != NLCD_NODATA]), 600)
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

    def test_classnames(self):
        classes = get_classnames_from_raster_attr_table(NLCD_RASTER_PATH)

        # See https://www.mrlc.gov/data/legends/national-land-cover-database-class-legend-and-description
        # for a list of classes in NLCD.
        # 20 classes total 4 are specific to Alaska and so not in our dataset.
        self.assertEqual(len(classes), 16)
        for _, attrs in classes.items():
            self.assertRegexpMatches(attrs['color'], '#[0-9a-fA-F]{6}')


def _reproject_to_nlud(parcel_wkt_epsg3857):
    """Reproject a WKT polygon to the NLCD projection.

    Args:
        parcel_wkt_epsg3857 (string): A WKT polygon projected in epsg 3857 "Web
            Mercator".

    Returns:
        parcel (shapely.geometry): A Shapely geometry of the input parcel where
            the geometry has been transformed to the NLCD's projection.
    """
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
    """Create an LULC raster in the NLCD projection covering the parcel.

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

    # Round "up" to the nearest pixel, sort of the pixel-math version of
    # rasterizing the bounding box with "ALL_TOUCHED=TRUE".
    buf_minx -= abs((buf_minx - NLCD_ORIGIN_X) % PIXELSIZE_X)
    buf_miny -= abs((buf_miny - NLCD_ORIGIN_Y) % PIXELSIZE_Y)
    buf_maxx += PIXELSIZE_X - abs((buf_maxx - NLCD_ORIGIN_X) % PIXELSIZE_X)
    buf_maxy += PIXELSIZE_Y - abs((buf_maxy - NLCD_ORIGIN_Y) % PIXELSIZE_Y)

    n_cols = abs(int(math.ceil((buf_maxx - buf_minx) / PIXELSIZE_X)))
    n_rows = abs(int(math.ceil((buf_maxy - buf_miny) / PIXELSIZE_Y)))

    raster_driver = gdal.GetDriverByName('GTIFF')
    target_raster = raster_driver.Create(
        target_local_gtiff_path, n_cols, n_rows, 1, gdal.GDT_Byte,
        options=DEFAULT_GTIFF_CREATION_TUPLE_OPTIONS[1])
    target_raster.SetProjection(NLCD_SRS_WKT)
    target_raster.SetGeoTransform(
        [buf_minx, PIXELSIZE_X, 0, buf_maxy, 0, PIXELSIZE_Y])
    band = target_raster.GetRasterBand(1)
    band.SetNoDataValue(NLCD_NODATA)
    band.Fill(NLCD_NODATA)
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
        [parcel_geom], parcel_vector_path, NLCD_SRS_WKT, 'FlatGeoBuf')

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
            NLCD raster, projected in Albers Equal Area.
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
        NLCD_DTYPE, [NLCD_NODATA])
    target_raster = gdal.OpenEx(
        target_raster_path, gdal.OF_RASTER | gdal.GA_Update)
    target_band = target_raster.GetRasterBand(1)
    parcel_mask_raster = gdal.OpenEx(parcel_mask_raster_path, gdal.OF_RASTER)
    parcel_mask_band = parcel_mask_raster.GetRasterBand(1)

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

    # clean up mask raster before rmtree
    parcel_mask_band = None
    parcel_mask_raster = None

    shutil.rmtree(working_dir)


def pixelcounts_under_parcel(parcel_wkt_epsg3857, source_raster_path):
    """Get a breakdown of pixel counts under a parcel per lulc code.

    Args:
        parcel_wkt_epsg3857 (str): The parcel WKT in web mercator.
        source_raster_path (str): The LULC to get pixel counts from.

    Returns:
        counts (dict): A dict mapping int lulc codes to float (0-1) percent of
            pixels rounded to 4 decimal places.  This percentage reflects the
            percentage of pixels under the parcel, not the lulc, so if a parcel
            covers 4 pixels, 1 of lulc code 5 and 3 of lulc code 6, ``counts``
            would be ``{5: 0.25, 6: 0.75}``.
    """
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
    target_raster.SetProjection(NLCD_SRS_WKT)
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
    for lulc_code, pixel_count in zip(values_under_parcel, counts):
        # cast lulc_codes to int from numpy_int16 for future json dump call
        # which does not allow numpy types for keys
        return_values[int(lulc_code)] = pixel_count

    return return_values


def get_classnames_from_raster_attr_table(raster_path):
    """Read classnames from a gdal-readable path.

    Args:
        raster_path (string): A GDAL raster path representing a raster.

    Returns:
        classes (dict): A mapping of int lulc codes to its string label.

    Raises:
        AssertionError: When the raster provided does not have an attribute
            table.
        AssertionError: When the target column name could not be found in the
            attribute table.
    """
    raster = gdal.OpenEx(raster_path)
    band = raster.GetRasterBand(1)
    attr_table = band.GetDefaultRAT()
    if attr_table is None:
        raise AssertionError(
            "Could not load attribute table. Did you include the sidecar "
            ".tif.aux.xml file?")

    # locate the name column
    name_col_idx = -1
    target_colname = 'NLCD Land Cover Class'
    for col_idx in range(attr_table.GetColumnCount() - 1):
        if attr_table.GetNameOfCol(col_idx) == target_colname:
            name_col_idx = col_idx
            break
    if name_col_idx == -1:
        raise AssertionError(
            f"Could not find column {target_colname} in {raster_path}")

    color_table = band.GetColorTable()

    def _to_hex(r, g, b, a):
        return f"#{r:02x}{g:02x}{b:02x}"

    classes = {}
    for row_idx in range(attr_table.GetRowCount()):
        name = attr_table.GetValueAsString(row_idx, name_col_idx)
        if name and name != 'Unclassified':
            classes[row_idx] = {
                'name': name,
                'color': _to_hex(*color_table.GetColorEntry(row_idx)),
            }

    return classes


def do_work(host, port, outputs_location):
    job_queue_url = f'http://{host}:{port}/jobsqueue/'
    LOGGER.info(f'Starting worker, queueing {job_queue_url}')
    LOGGER.info(f'Polling the queue every {POLLING_INTERVAL_S}s if no work')
    while True:
        response = requests.get(job_queue_url)
        # if there is no work on the queue, expecting response.json()==None
        if not response.json():
            time.sleep(POLLING_INTERVAL_S)
            continue

        # response.json() returns a stringified json object, so need to load
        # it into a python dict
        response_json = json.loads(response.json())
        server_args = response_json['server_attrs']
        job_id = server_args['job_id']
        job_type = response_json['job_type']
        job_args = response_json['job_args']

        # Make sure the appropriate directory is created
        scenarios_dir = os.path.join(outputs_location, 'scenarios')
        model_outputs_dir = os.path.join(outputs_location, 'model_outputs')
        for path in (scenarios_dir, model_outputs_dir):
            if not os.path.exists(path):
                os.makedirs(path)

        try:
            if job_type in {JOBTYPE_FILL, JOBTYPE_WALLPAPER}:
                scenario_id = server_args['scenario_id']
                workspace = os.path.join(scenarios_dir, str(scenario_id))
                result_path = os.path.join(
                    workspace, f'{scenario_id}_{job_type}.tif')
                os.makedirs(workspace, exist_ok=True)

                if job_type == 'parcel_fill':
                    fill_parcel(
                        parcel_wkt_epsg3857=job_args['target_parcel_wkt'],
                        fill_lulc_class=job_args['lulc_class'],
                        target_lulc_path=result_path
                    )
                elif job_type == 'wallpaper':
                    wallpaper_temp_dir = tempfile.mkdtemp(
                        dir=workspace, prefix='wallpaper-')
                    wallpaper_parcel(
                        parcel_wkt_epsg3857=job_args['target_parcel_wkt'],
                        pattern_wkt_epsg3857=job_args['pattern_bbox_wkt'],
                        source_nlud_raster_path=job_args['lulc_source_url'],
                        target_raster_path=result_path,
                        working_dir=wallpaper_temp_dir
                    )
                    try:
                        shutil.rmtree(wallpaper_temp_dir)
                    except OSError as e:
                        LOGGER.exception(
                            "Something went wrong removing "
                            f"{wallpaper_temp_dir}: {e}")
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
            elif job_type == JOBTYPE_PARCEL_STATS:
                data = {
                    'result': {
                        'lulc_stats': {
                            'base': pixelcounts_under_parcel(
                                job_args['target_parcel_wkt'],
                                job_args['lulc_source_url']
                            ),
                        }
                    }
                }
            elif job_type == JOBTYPE_LULC_CLASSNAMES:
                data = {
                    'result': get_classnames_from_raster_attr_table(
                        NLCD_RASTER_PATH)
                }
            else:
                raise ValueError(f"Invalid job type: {job_type}")
            status = STATUS_SUCCESS
        except Exception as error:
            LOGGER.exception(f'{job_type} failed: {error}')
            status = STATUS_FAILURE
            result_path = None
            data = {}  # data doesn't matter in a failure
        finally:
            data['server_attrs'] = server_args
            data['status'] = status
            requests.post(
                f'{job_queue_url}{ENDPOINTS[job_type]}',
                data=json.dumps(data)
            )


def main():
    parser = argparse.ArgumentParser(
        __name__, description=('Worker for Urban Online Workflow'))
    parser.add_argument('queue_host')
    parser.add_argument('queue_port')
    parser.add_argument('output_dir')

    args = parser.parse_args()
    do_work(
        host=args.queue_host,
        port=args.queue_port,
        outputs_location=args.output_dir
    )


if __name__ == '__main__':
    main()
