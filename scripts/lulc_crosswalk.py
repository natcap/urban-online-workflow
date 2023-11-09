import json
import pandas

df = pandas.read_csv('../appdata/lulc_crosswalk.csv')


def construct_nlud_names(row):
    name = ''
    if row.nlud_simple_class:
        name += row.nlud_simple_class
    if row.nlud_simple_subclass:
        name += f' ({row.nlud_simple_subclass})'
    return name


df = df.fillna('')
df['nlud_name'] = df.apply(construct_nlud_names, axis=1)

with open('../appdata/nlcd_colormap.json') as file:
    nlcd_map = json.load(file)
with open('../appdata/nlud_colormap.json') as file:
    nlud_map = json.load(file)
with open('../appdata/tree_colormap.json') as file:
    tree_map = json.load(file)

data = {}
for idx, row in df.iterrows():
    data[row.lucode] = {
        'nlcd': {
            'name': row.nlcd_lulc,
            'color': nlcd_map[str(row.nlcd)]
        },
        'nlud': {
            'name': row.nlud_name,
            'color': nlud_map[str(row.nlud_simple)]
        },
        'tree': {
            'name': row.tree_canopy_cover,
            'color': tree_map[str(row.tree)]
        }
    }


with open('../appdata/lulc_crosswalk.json', 'w', encoding='utf-8') as file:
    jsonstring = json.dumps(data)
    file.write(jsonstring + '\n')
