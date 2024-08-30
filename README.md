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

## App runs on
`http://localhost:3000`

## View fastapi endpoint documentation
`http://localhost:8000/docs`

## Data Requirements
These are data used by the python worker. Download these to your local
`appdata/` folder to run the app locally. Please reach out to repository maintainers to get access to these.

local path which mounts in container | (bucket where source file can be found)
- `appdata/lulc_overlay_3857.tif` | (natcap-urban-online-datasets-**public**)

- `appdata/invest-data/et0_annual_cgiar_3857.tif` | (natcap-urban-online-datasets)
- `appdata/invest-data/acs_tract_3857.gpkg` | (natcap-urban-online-datasets)
- `appdata/invest-data/acs_tract_poverty.csv` | (natcap-urban-online-datasets)
- `appdata/invest-data/acs_tract_race.csv` | (natcap-urban-online-datasets)
- `appdata/invest-data/population_per_pixel_2020_3857.tif` | (natcap-urban-online-datasets)

Data Documentation:
https://drive.google.com/drive/u/1/folders/1FxlHVWFfICc5j-f7z9sWUBrVJj1Lw1zQ
https://drive.google.com/drive/u/1/folders/1ZUF_RLc2L-fglFdsJOVg-xSD7J9Gz1BF


## Necessary API tokens
Currently need to add a `.env` file to `frontend/` with necessary API tokens. Please reach out to repository maintainers to get access to these.

## Necessary software for development
- Docker
- Git
