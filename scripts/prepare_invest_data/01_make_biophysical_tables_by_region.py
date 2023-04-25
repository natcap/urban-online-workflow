"""
Create biophysical tables for invest, by bioregion.

Chris N. parameterized many biophysical tables for invest models,
assigning values that vary by "bioregion". To use these tables
in invest, we need to split them to make one table per bioregion.
https://github.com/chrisnootenboom/urban-workflow
"""
import os
import pandas

# Chris's biophysical tables
base_path = '../urban-workflow/naturban/data/parameters'
table_list = [
    'building_energy_table_bioregions.csv',
    'pollination_3_8_0_guilds_bioregions.csv',
    'pollination_3_8_0_pollinators__nlcd_bioregions.csv',
    'ucm_nlcd_bioregions.csv',
    'urban_carbon_nlcd_bioregions.csv'
]
label = 'bioregion'

target_path = '../appdata/invest-data/biophysical_tables'

for table in table_list:
    data = pandas.read_csv(os.path.join(base_path, table))
    groups = data.groupby(label)
    for group, df in groups:
        target_filename = os.path.join(
            target_path, table.replace('bioregions', group))
        print(f'writing {target_filename}')
        df.to_csv(target_filename)


