# urban-online-workflow
This repository hosts the beta implementation of the Urban Online ES Workflow.
The project is intended to give urban planners the ability to create and assess
scenarios using InVEST Urban models.

## Setup with docker compose

```shell
$ docker compose up
```

or if you want to force a rebuild of the containers,

```shell
$ docker compose up --build
```

## View fastapi endpoint documentation
`http://localhost:8000/docs`

## Data Requirements
These are data used by the python worker.  

local path which mounts in container - (bucket where source file can be found)
`appdata/lulc_crosswalk.csv`  
`appdata/lulc_overlay_3857.tif` (natcap-urban-online-datasets-**public**)
`appdata/invest-data/CGIAR_et0_annual_epsg_3857.tif` (natcap-urban-online-datasets)
`appdata/invest-data/OE_Bioregions_3857.shp` (natcap-urban-online-datasets)
`appdata/invest-data/acs_tract_3857.gpkg` (natcap-urban-online-datasets)
`appdata/invest-data/acs_tract_poverty.csv` (natcap-urban-online-datasets)
`appdata/invest-data/acs_tract_race.csv` (natcap-urban-online-datasets)

