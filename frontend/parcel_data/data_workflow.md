
1. Downloaded the file COSA_Zoning.geojson found through the [City of San Antonio OpenData site](https://opendata-cosagis.opendata.arcgis.com/datasets/CoSAGIS::cosa-zoning/explore?location=29.435622%2C-98.518921%2C10.89) [download link](https://opendata.arcgis.com/datasets/5cdc1086f57541e892154eb8e6e86782_12.geojson)

2. Using [Mapbox Tiling Service Data Sync](https://github.com/mapbox/mts-data-sync) (revision #e809918):

        mtsds --config COSA_Zoning.geojson

    When prompted for a tileset id, I entered `san-antonio-parcels`.
    When prompted for a dataset name, I entered `San Antonio Parcels`.

    This created the files `COSA_Zoning.geojsonl`, `mts-config.json`, and `mts-recipe.json`.

    I edited `mts-recipe.json` to set `"maxzoom": 16`.

        mtsds --estimate

    Estimated cost: $0

    Then created and published the tileset:

        mtsds --sync
