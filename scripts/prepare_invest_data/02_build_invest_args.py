"""
Create parameter sets for each invest model & each bioregion.

This script should run anytime we update the available bioregions
or associated parameter values. The JSON files created are
tracked by git.
"""
import os

from natcap.invest import datastack

# TODO: These constants are also hardcoded in worker.py
# Maybe they should be defined in some shared resource.
BASE_DATA_PATH = '../../appdata/invest-data'
AVAILABLE_BIOREGIONS = ['NA10', 'NA11', 'NA12', 'NA13', 'NA15', 'NA16', 'NA17',
                        'NA18', 'NA19', 'NA20', 'NA21', 'NA22', 'NA23', 'NA24',
                        'NA25', 'NA27', 'NA28', 'NA29', 'NA30', 'NA31', 'NT26']


def build_carbon_args(bioregion):
    model_name = 'carbon'
    args_dict = {
        "calc_sequestration": True,
        "carbon_pools_path": "",
        "do_redd": False,
        "do_valuation": False,
        "lulc_cur_path": ""
    }
    # Make this path relative to the location of the target json
    args_dict['carbon_pools_path'] = \
        f'../biophysical_tables/urban_carbon_nlcd_{bioregion}.csv'
    datastack.build_parameter_set(
        args_dict,
        model_name,
        os.path.join(BASE_DATA_PATH, model_name, f'carbon_{bioregion}_args.json'),
        relative=True)

    return None


if __name__ == '__main__':
    for region in AVAILABLE_BIOREGIONS:
        build_carbon_args(region)
