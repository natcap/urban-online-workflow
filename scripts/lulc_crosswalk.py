import json
import pandas

df = pandas.read_csv('../appdata/overlay_simple_crosswalk.csv')

df = df.fillna('')
df['name'] = \
    df['nlud_simple_class'] + ' | ' + \
    df['nlud_simple_subclass'] + ' | ' + \
    df['nlcd_lulc']

data = dict(zip(df['lucode'], df['name']))

with open('../appdata/overlay_simple_crosswalk.json', 'w', encoding='utf-8') as file:
    jsonstring = json.dumps(data)
    file.write(jsonstring + '\n')
