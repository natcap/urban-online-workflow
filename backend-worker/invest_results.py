import logging
import numpy
import os

from osgeo import gdal
import pygeoprocessing

logging.basicConfig(level=logging.INFO)
LOGGER = logging.getLogger(__name__)


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


    Return:
        carbon_results (dict) : A python dictionary with keys as the output
            name and values as the aggregated sum.
    """
    #carbon_output_dir = os.path.join(workspace_dir, 'intermediate_outputs')
    carbon_outputs = {
        'tot_c_cur': os.path.join(workspace_dir, 'tot_c_cur.tif'),
    #    'c_above_cur': os.path.join(carbon_output_dir, 'c_above_cur.tif'),
    #    'c_below_cur': os.path.join(carbon_output_dir, 'c_below_cur.tif'),
    #    'c_dead_cur': os.path.join(carbon_output_dir, 'c_dead_cur.tif'),
    #    'c_soil_cur': os.path.join(carbon_output_dir, 'c_soil_cur.tif'),
    }

    carbon_results = {}
    for output, output_path in carbon_outputs.items():
        carbon_results[output] = pygeoprocessing.raster_reduce(
            lambda total, block: total + numpy.sum(block), (output_path, 1), 0)

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

    Get the total nature access balance and average nature access balance.

    Return:
        nature_access_results (dict) : A python dictionary with values for 
            nature access balance in total and on average for the aggregated
            area.

            keys:
                'ntr_bal_tot'
                'ntr_bal_avg'
    """

    nature_access_output_dir = os.path.join(workspace_dir, 'output')
    nature_access_outputs = {
        'ntr_bal_tot': os.path.join(
            nature_access_output_dir, 'urban_nature_balance_totalpop.tif'),
    }

    nature_access_results = {}
    for output, output_path in nature_access_outputs.items():
        nature_access_results[output] = pygeoprocessing.raster_reduce(
            lambda total, block: total + numpy.sum(block), (output_path, 1), 0)

    balance_vector_path = os.path.join(
        workspace_dir, 'output', 'admin_boundaries.gpkg')
    value_field = 'SUP_DEMadm_cap'
    balance_dict = _read_field_from_vector(
        balance_vector_path, 'FID', value_field)
    # Currently only aggregating over one large bounding box, so only one entry
    feat_key = balance_dict.keys()[0]
    nature_access_results['ntr_bal_avg'] = balance_dict[feat_key]

    return nature_access_results
