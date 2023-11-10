import json
import pandas

df = pandas.read_csv('../appdata/lulc_crosswalk.csv')
df = df.fillna('')

data = {}
for idx, row in df.iterrows():
    data[row.lucode] = {
        'nlcd': str(row.nlcd),
        'nlud': str(row.nlud_simple),
        'tree': str(row.tree)
    }


with open('../appdata/lulc_crosswalk.json', 'w', encoding='utf-8') as file:
    jsonstring = json.dumps(data)
    file.write(jsonstring + '\n')
