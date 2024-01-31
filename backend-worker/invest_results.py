import json
import logging
import numpy
import os

import geopandas
from osgeo import gdal
import pandas
import pygeoprocessing

from invest_args import INVEST_BASE_PATH
import ucm_valuation

logging.basicConfig(level=logging.INFO)
LOGGER = logging.getLogger(__name__)

CENSUS_VECTOR_PATH = f'{INVEST_BASE_PATH}/acs_tract_3857.gpkg'
CENSUS_RACE_PATH = f'{INVEST_BASE_PATH}/acs_tract_race.csv'
CENSUS_POVERTY_PATH = f'{INVEST_BASE_PATH}/acs_tract_poverty.csv'
RACE_VARS = [
    'White (Not Hispanic or Latino)',
    'Black', 'American Indian', 'Asian', 'Hawaiian', 'Other',
    'Two or more races', 'Hispanic or Latino']
POVERTY_VARS = [
    'Household received Food Stamps or SNAP in the past 12 months',
    'Household received Food Stamps or SNAP in the past 12 months | Income in the past 12 months below poverty level',
    'Household received Food Stamps or SNAP in the past 12 months | Income in the past 12 months at or above poverty level',
    'Household did not receive Food Stamps or SNAP in the past 12 months',
    'Household did not receive Food Stamps or SNAP in the past 12 months | Income in the past 12 months below poverty level',
    'Household did not receive Food Stamps or SNAP in the past 12 months | Income in the past 12 months at or above poverty level']


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
    LOGGER.info('Gathering Carbon Model results')
    #carbon_output_dir = os.path.join(workspace_dir, 'intermediate_outputs')
    carbon_outputs = {
        'tot_c_cur': os.path.join(workspace_dir, 'tot_c_cur.tif'),
    #    'c_above_cur': os.path.join(carbon_output_dir, 'c_above_cur.tif'),
    #    'c_below_cur': os.path.join(carbon_output_dir, 'c_below_cur.tif'),
    #    'c_dead_cur': os.path.join(carbon_output_dir, 'c_dead_cur.tif'),
    #    'c_soil_cur': os.path.join(carbon_output_dir, 'c_soil_cur.tif'),
    #    'c_embedded_cur': os.path.join(carbon_output_dir, 'c_embedded_cur.tif'),
    #    'c_emissions_cur': os.path.join(carbon_output_dir, 'c_emissions_cur.tif'),
    }

    carbon_results = {}
    for output, output_path in carbon_outputs.items():
        carbon_results[output] = pygeoprocessing.raster_reduce(
            lambda total, block: total + numpy.sum(block), (output_path, 1), 0)

    results_json_path = os.path.join(workspace_dir, "derived_results.json")
    with open(results_json_path, "w") as fp:
        json.dump(carbon_results, fp)

    return results_json_path


def _extract_census_from_aoi(aoi_vector_path):
    aoi_gdf = geopandas.read_file(aoi_vector_path)
    census_gdf = geopandas.read_file(CENSUS_VECTOR_PATH)

    tracts_over_aoi = aoi_gdf.sjoin(census_gdf, how='left')
    LOGGER.debug(tracts_over_aoi)
    tracts = [int(t) for t in tracts_over_aoi['tract']]

    race_data = pandas.read_csv(CENSUS_RACE_PATH)
    poverty_data = pandas.read_csv(CENSUS_POVERTY_PATH)

    race_in_tracts = race_data[race_data['tract'].isin(tracts)]
    poverty_in_tracts = poverty_data[poverty_data['tract'].isin(tracts)]

    race_dict = race_in_tracts[RACE_VARS].sum().to_dict()
    poverty_dict = poverty_in_tracts[POVERTY_VARS].sum().to_dict()
    return {'race': race_dict, 'poverty': poverty_dict}


def urban_cooling(workspace_dir):
    """Post processing for urban cooling model.

    Get the average temperature value from the ``uhi_results.shp`` output. 
    Since we're currently only aggregating based on one bounding box vector
    there will be only one result to return.

    Return:
        urban_cooling_results (dict) : A python dictionary of urban cooling
            & census metrics summarized in the AOI.
    """
    LOGGER.info('Doing Urban Cooling valuation')
    uhi_vector_path = os.path.join(workspace_dir, 'uhi_results.shp')
    valuation_args = {
        'workspace_dir': os.path.join(workspace_dir, 'valuation'),
        'city': 'San Antonio',
        'lulc_tif': os.path.join(workspace_dir, 'intermediate', 'lulc.tif'),
        'air_temp_tif': os.path.join(workspace_dir, 'intermediate', 'T_air.tif'),
        'dd_energy_path': os.path.join(
            INVEST_BASE_PATH, 'biophysical_tables',
            'placeholder_ucm_energy_parameters.csv'),
        'mortality_risk_path': os.path.join(
            INVEST_BASE_PATH, 'biophysical_tables',
            'guo_et_al_2014_mortality_risk.csv'),
        'aoi_vector_path': uhi_vector_path
    }
    ucm_valuation.execute(valuation_args)

    LOGGER.info('Gathering Urban Cooling Model results')
    urban_cooling_results = {}
    summary_field_list = ['avg_tmp_v', 'cdd_cost']
    for value_field in summary_field_list:
        fid_metric_dict = _read_field_from_vector(
            uhi_vector_path, 'FID', value_field)
        # Only aggregating over one large serviceshed, so only one entry
        feat_key = list(fid_metric_dict.keys())[0]
        urban_cooling_results[value_field] = fid_metric_dict[feat_key]

    LOGGER.info('Gathering Census data from AOI')
    census_data = {'census': _extract_census_from_aoi(uhi_vector_path)}
    results = {**urban_cooling_results, **census_data}
    LOGGER.info(results)
    results_json_path = os.path.join(workspace_dir, "derived_results.json")
    with open(results_json_path, "w") as fp:
        json.dump(results, fp)

    return results_json_path


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

    results_json_path = os.path.join(workspace_dir, "derived_results.json")
    with open(results_json_path, "w") as fp:
        json.dump(nature_access_results, fp)

    return results_json_path
