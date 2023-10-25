import json
import pandas

df = pandas.read_csv('../appdata/overlay_simple_crosswalk.csv')

def construct_names(row):
    name = ''
    if row.nlud_simple_class:
        name += row.nlud_simple_class
    if row.nlud_simple_subclass:
        name += f' ({row.nlud_simple_subclass})'
    if row.nlcd_lulc:
        name += f' | {row.nlcd_lulc}'
    return name


df = df.fillna('')
df['name'] = df.apply(construct_names, axis=1)
# df['name'] = \
#     df['nlud_simple_class'] + ' | ' + \
#     df['nlud_simple_subclass'] + ' | ' + \
#     df['nlcd_lulc']

# data = dict(zip(df['lucode'], df['name']))
data = {lucode: {'name': name} for lucode, name in zip(df['lucode'], df['name'])}

with open('../appdata/overlay_simple_crosswalk.json', 'w', encoding='utf-8') as file:
    jsonstring = json.dumps(data)
    file.write(jsonstring + '\n')
