import logging
import numpy
import os

from osgeo import gdal, ogr
import pygeoprocessing
import shapely.geometry

logging.basicConfig(level=logging.INFO)
LOGGER = logging.getLogger(__name__)


def _aggregate_sum(raster_uri, vector_uri=None):
    """Return a sum aggregated value."""

    nodata = pygeoprocessing.get_raster_info(raster_uri)['nodata'][0]

    raster_sum = 0.0
    for _, block in pygeoprocessing.iterblocks((raster_uri, 1)):
        # The float64 dtype in the sum is needed to reduce numerical error in
        # the sum.  Users calculated the sum with ArcGIS zonal statistics,
        # noticed a difference and wrote to us about it on the forum.
        raster_sum += numpy.sum(
            block[~utils.array_equals_nodata(
                    block, nodata)], dtype=numpy.float64)

    return raster_sum


def _aggregate_mean(raster_uri, vector_uri=None):
    """Return a mean aggregated value."""

    nodata = pygeoprocessing.get_raster_info(raster_uri)['nodata'][0]

    raster_sum = 0.0
    for _, block in pygeoprocessing.iterblocks((raster_uri, 1)):
        # The float64 dtype in the sum is needed to reduce numerical error in
        # the sum.  Users calculated the sum with ArcGIS zonal statistics,
        # noticed a difference and wrote to us about it on the forum.
        raster_sum += numpy.sum(
            block[~utils.array_equals_nodata(
                    block, nodata)], dtype=numpy.float64)

    return raster_sum


def _read_field_from_vector(vector_path, key_field, value_field):
    """Read a field from a vector's first layer.

    Args:
        vector_path (string): The string path to a vector.
        key_field (string): The string key field within the vector.
            ``key_field`` must exist within the vector at ``vector_path``.
            ``key_field`` is case-sensitive.
        value_field (string): The string value field within the vector.
            ``value_field`` must exist within the vector at ``vector_path``.
            ``value_field`` is case-sensitive.

    Returns:
        attribute_map (dict): A dict mapping each ``key_field`` key to
            the corresponding ``value_field`` value.
    """
    vector = gdal.OpenEx(vector_path)
    layer = vector.GetLayer()
    attribute_map = {}
    for feature in layer:
        if key_field == 'FID':
            key = feature.GetFID()
        else:
            key = feature.GetField(key_field)
        attribute_map[key] = feature.GetField(value_field)
    return attribute_map


def carbon(workspace_dir):
    """Post processing for carbon model.

    TODO:
        - How should carbon outputs be aggregated? Per raster, under a vector?
        - How do we display / communicate how results are aggregated?

    Return:
        carbon_results (dict) : A python dictionary with keys as the output
            name and values as the aggregated sum.
    """
    carbon_output_dir = os.path.join(workspace_dir, 'intermediate_outputs')
    carbon_outputs = {
        'c_above_cur': os.path.join(carbon_output_dir, 'c_above_cur.tif'),
        'c_below_cur': os.path.join(carbon_output_dir, 'c_below_cur.tif'),
        'c_dead_cur': os.path.join(carbon_output_dir, 'c_dead_cur.tif'),
        'c_soil_cur': os.path.join(carbon_output_dir, 'c_soil_cur.tif'),
    }

    carbon_results = {}
    for output, output_path in carbon_outputs.items():
        carbon_results[output] = _aggregate_sum(output_path)

    return carbon_results


def urban_cooling(workspace_dir):
    """Post processing for urban cooling model.

    Get the average temperature value from the ``uhi_results.shp`` output. 
    Since we're currently only aggregating based on one bounding box vector
    there will be only one result to return.

    Return:
        urban_cooling_results (dict) : A python dictionary with a single
            key of 'avg_tmp_v' and it's corresponding value.
    """

    uhi_vector_path = os.path.join(workspace_dir, 'uhi_results.shp')
    value_field = 'avg_tmp_v'
    avg_tmp_dict = _read_field_from_vector(uhi_vector_path, 'FID', value_field)
    # Currently only aggregating over one large bounding box, so only one entry
    feat_key = avg_tmp_dict.keys()[0]
    urban_cooling_results = {value_field: avg_tmp_dict[feat_key]}

    return urban_cooling_results


def urban_nature_access(workspace_dir):
    """Post processing for urban nature access model.

    Return:
        nature_access_results (dict) : A python dictionary with keys as the
            output name and values as the aggregated sum.
    """
    nature_access_output_dir = os.path.join(workspace_dir, 'intermediate_outputs')
    nature_access_outputs = {
        'c_above_cur': os.path.join(nature_access_output_dir, 'c_above_cur.tif'),
        'c_below_cur': os.path.join(nature_access_output_dir, 'c_below_cur.tif'),
        'c_dead_cur': os.path.join(nature_access_output_dir, 'c_dead_cur.tif'),
        'c_soil_cur': os.path.join(nature_access_output_dir, 'c_soil_cur.tif'),
    }

    nature_access_results = {}
    for output, output_path in nature_access_outputs.items():
        nature_access_results[output] = _aggregate_sum(output_path)

    return nature_access_results
    pass
