"""
Based on https://planetarycomputer.microsoft.com/dataset/ms-buildings#Example-Notebook
The resulting GPKG is hosted on GCS natcap-urban-online-datasets
"""

import subprocess

import dask_geopandas
import deltalake
import mercantile
import pystac_client
import planetary_computer
import pygeoprocessing
import shapely

from osgeo import osr

catalog = pystac_client.Client.open(
    "https://planetarycomputer.microsoft.com/api/stac/v1",
    modifier=planetary_computer.sign_inplace,
)
collection = catalog.get_collection("ms-buildings")

srs = osr.SpatialReference()
srs.ImportFromEPSG(4326)
target_proj_wkt = srs.ExportToWkt()
base_info = pygeoprocessing.get_raster_info('../appdata/lulc_overlay_3857.tif')
bbox = pygeoprocessing.transform_bounding_box(
    base_info['bounding_box'],
    base_info['projection_wkt'],
    target_proj_wkt
)
print(bbox)

asset = collection.assets['delta']
storage_options = {
    "account_name": asset.extra_fields["table:storage_options"]["account_name"],
    "sas_token": asset.extra_fields["table:storage_options"]["credential"],
}
table = deltalake.DeltaTable(asset.href, storage_options=storage_options)

quadkeys = [
    int(mercantile.quadkey(tile))
    for tile in mercantile.tiles(*bbox, zooms=9)
]
uris = table.file_uris([("quadkey", "in", quadkeys)])

df = dask_geopandas.read_parquet(uris, storage_options=storage_options)
mask = df.intersects(shapely.geometry.box(*bbox))
data = df[mask]
data.to_parquet('buildings.parquet')

# parquet driver requires libgdal-arrow-parquet, which is only supported in gdal>=3.8
subprocess.run(
    ['ogr2ogr', '-f', 'GPKG', 'buildings_san_antonio.gpkg', 'buildings.parquet'])
