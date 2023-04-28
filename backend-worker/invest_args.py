import logging
import os

from osgeo import gdal
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

BIOREGIONS_VECTOR_PATH = f'{INVEST_BASE_PATH}/OE_Bioregions_3857.shp'
BIOREGIONS_FIELD = 'BIOREGION_'
# The regions for which we have biophysical parameters
AVAILABLE_BIOREGIONS = ['NA10', 'NA11', 'NA12', 'NA13', 'NA15', 'NA16', 'NA17',
                        'NA18', 'NA19', 'NA20', 'NA21', 'NA22', 'NA23', 'NA24',
                        'NA25', 'NA27', 'NA28', 'NA29', 'NA30', 'NA31', 'NT26']


def get_bioregion(point):
    vector = gdal.OpenEx(BIOREGIONS_VECTOR_PATH, gdal.OF_VECTOR)
    layer = vector.GetLayer()
    region = None
    for feature in layer:
        geom = shapely.wkt.loads(feature.GetGeometryRef().ExportToWkt())
        if geom.contains(point):
            region = feature.GetField(BIOREGIONS_FIELD)
    if region not in AVAILABLE_BIOREGIONS:
        raise ValueError(
            f'the point {point} is not contained '
            f'within a parameterized bioregion. Region: {region}')
    return region


def carbon(lulc_path, workspace_dir):
    args_dict = {
        "workspace_dir": workspace_dir,
        "calc_sequestration": True,
        "carbon_pools_path": "",
        "do_redd": False,
        "do_valuation": False,
        "lulc_cur_path": lulc_path
    }

    [minx, miny, maxx, maxy] = pygeoprocessing.get_raster_info(
        lulc_path)['bounding_box']
    center = shapely.geometry.Point(
        (minx + maxx) / 2, (miny + maxy) / 2)
    bioregion = get_bioregion(center)

    args_dict['carbon_pools_path'] = os.path.join(
        INVEST_BASE_PATH,
        'biophysical_tables',
        f'urban_carbon_nlcd_{bioregion}.csv')

    return args_dict


def urban_cooling(lulc_path, workspace_dir):
    # Parameter values from
    # https://github.com/chrisnootenboom/urban-workflow/blob/master/configs/inputs_config.yaml
    aoi_vector_path = os.path.join(workspace_dir, 'aoi.geojson')
    args_dict = {
        "workspace_dir": workspace_dir,
        "aoi_vector_path": aoi_vector_path,
        "lulc_raster_path": lulc_path,
        "do_energy_valuation": False,
        "do_productivity_valuation": False,
        "ref_eto_raster_path": os.path.join(
            INVEST_BASE_PATH, "CGIAR_et0_annual_epsg_3857.tif"),
        "cc_method": "factors",
        "cc_weight_albedo": "0.2",
        "cc_weight_eti": "0.2",
        "cc_weight_shade": "0.6",
        "t_air_average_radius": "600",
        "green_area_cooling_distance": "450",
        "t_ref": "35",  # TODO: derive from location
        "uhi_max": "3.56"  # TODO: derive from location
    }

    lulc_info = pygeoprocessing.get_raster_info(lulc_path)
    [minx, miny, maxx, maxy] = lulc_info['bounding_box']

    aoi_geom = shapely.geometry.box(minx, miny, maxx, maxy)
    pygeoprocessing.shapely_geometry_to_vector(
        [aoi_geom], aoi_vector_path, lulc_info['projection_wkt'], 'GEOJSON')

    center = shapely.geometry.Point(
        (minx + maxx) / 2, (miny + maxy) / 2)
    bioregion = get_bioregion(center)

    args_dict['biophysical_table_path'] = os.path.join(
        INVEST_BASE_PATH,
        'biophysical_tables',
        f'ucm_nlcd_{bioregion}.csv')

    return args_dict

