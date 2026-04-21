import logging
import os

import pygeoprocessing
import shapely.geometry

logging.basicConfig(level=logging.INFO)
LOGGER = logging.getLogger(__name__)

INVEST_DATA = 'invest-data'
INVEST_BASE_PATHS = {
    'docker': f'/opt/appdata/{INVEST_DATA}',
    'local': os.path.join(
        os.path.dirname(__file__), '..', 'appdata', INVEST_DATA)
}
INVEST_BASE_PATH = None
for data_path in INVEST_BASE_PATHS.values():
    if os.path.exists(data_path):
        INVEST_BASE_PATH = data_path
        break
if INVEST_BASE_PATH is None:
    raise AssertionError(
        f"Could not find {INVEST_DATA} at any known locations")
LOGGER.info(f"Using InVEST data at {INVEST_BASE_PATH}")

EVAPOTRANSPIRATION = os.path.join(
    INVEST_BASE_PATH, "et0_annual_cgiar_3857.tif")
CARBON_TABLE_PATH = os.path.join(
    INVEST_BASE_PATH, 'biophysical_tables',
    'carbon__nlcd_nlud_tree.csv')
UCM_TABLE_PATH = os.path.join(
    INVEST_BASE_PATH, 'biophysical_tables',
    'ucm__nlcd_nlud_tree.csv')
UNA_TABLE_PATH = os.path.join(
    INVEST_BASE_PATH, 'biophysical_tables',
    'una__nlcd_nlud_tree.csv')
POPULATION_RASTER_PATH = os.path.join(
    INVEST_BASE_PATH,
    'population_per_pixel_2020_3857.tif')


def carbon(lulc_path, workspace_dir, study_area_wkt):
    args_dict = {
        "workspace_dir": workspace_dir,
        "calc_sequestration": True,
        "carbon_pools_path": CARBON_TABLE_PATH,
        "do_redd": False,
        "do_valuation": False,
        "lulc_cur_path": lulc_path
    }

    return args_dict


def urban_cooling(lulc_path, workspace_dir, study_area_wkt):
    cooling_distance = 450  # meters
    lulc_info = pygeoprocessing.get_raster_info(lulc_path)
    aoi_vector_path = os.path.join(workspace_dir, 'aoi.geojson')
    aoi_geom = shapely.wkt.loads(study_area_wkt).buffer(cooling_distance)
    pygeoprocessing.shapely_geometry_to_vector(
        [aoi_geom], aoi_vector_path, lulc_info['projection_wkt'], 'GEOJSON')

    # Parameter values from
    # https://github.com/chrisnootenboom/urban-workflow/blob/master/configs/inputs_config.yaml
    args_dict = {
        "workspace_dir": workspace_dir,
        "aoi_vector_path": aoi_vector_path,
        "lulc_raster_path": lulc_path,
        "biophysical_table_path": UCM_TABLE_PATH,
        "do_energy_valuation": False,
        "do_productivity_valuation": False,
        "ref_eto_raster_path": EVAPOTRANSPIRATION,
        "cc_method": "factors",
        "cc_weight_albedo": "0.2",
        "cc_weight_eti": "0.2",
        "cc_weight_shade": "0.6",
        "t_air_average_radius": "600",
        "green_area_cooling_distance": str(cooling_distance),
        "t_ref": "35",  # TODO: derive from location
        "uhi_max": "11"  # TODO: derive from location
        # "uhi_max": "3.56"  # TODO: derive from location
    }

    return args_dict


def urban_nature_access(lulc_path, workspace_dir, study_area_wkt):
    search_radius = 800
    aoi_geom = shapely.wkt.loads(study_area_wkt).buffer(search_radius)
    lulc_info = pygeoprocessing.get_raster_info(lulc_path)
    aoi_vector_path = os.path.join(workspace_dir, 'aoi.geojson')
    pygeoprocessing.shapely_geometry_to_vector(
        [aoi_geom], aoi_vector_path, lulc_info['projection_wkt'], 'GEOJSON')

    args_dict = {
        "workspace_dir": workspace_dir,
        "admin_boundaries_vector_path": aoi_vector_path,
        "aggregate_by_pop_group": False,
        "decay_function": "dichotomy",
        "lulc_attribute_table": UNA_TABLE_PATH,
        "lulc_raster_path": lulc_path,
        "population_raster_path": POPULATION_RASTER_PATH,
        "search_radius": search_radius,
        "search_radius_mode": "uniform radius",
        "urban_nature_demand": "16.7"
    }

    return args_dict
