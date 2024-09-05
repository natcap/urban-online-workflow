"""Prepare socioeconomic data for map layers."""

import os

import geopandas
import pandas

data_dir = 'H:/Shared drives/Online Urban ES Modeling Tool/Data from Chris/LULC and Parameters August 2024/'
acs_vector_path = os.path.join(data_dir, 'acs_block_groups_3857.gpkg')
acs_table_path = os.path.join(data_dir, 'acs_block_group_equity_data.csv')

acs_gdf = geopandas.read_file(acs_vector_path)
acs_df = pandas.read_csv(acs_table_path)

join_field = 'GISJOIN'
data_fields = [
    'bivariate_income_temperature',
    'bivariate_bipoc_temperature']

acs_gdf = acs_gdf[[join_field, 'geometry']]

acs_gdf.set_index(join_field)
acs_df.set_index(join_field)
gdf = acs_gdf.join(acs_df[data_fields])
gdf = gdf.drop(columns=[join_field])

# gdf_3857 = gdf.to_crs(epsg=3857)

gdf.to_file(
    '../appdata/acs_block_group_equity.geojson',
    driver='GeoJSON')
