import logging
import os

from osgeo import gdal
import pygeoprocessing
import shapely.geometry

logging.basicConfig(level=logging.INFO)
LOGGER = logging.getLogger(__name__)


def _aggregate_values(raster_uri, vector_uri, method):
    """Return an aggregated value."""
    pass

def carbon(workspace_dir):
    """Post processing for carbon model."""
    pass


def urban_cooling(workspace_dir):
    """Post processing for urban cooling model."""
    pass


def urban_nature_access(workspace_dir):
    """Post processing for urban nature access model."""
    pass
