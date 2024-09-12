import Collection from 'ol/Collection';
import XYZ from 'ol/source/XYZ';
import LayerGroup from 'ol/layer/Group';
import TileLayer from 'ol/layer/Tile';
import MapboxVectorLayer from 'ol/layer/MapboxVector';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import VectorTileLayer from 'ol/layer/VectorTile';
import VectorTileSource from 'ol/source/VectorTile';
import GeoJSON from 'ol/format/GeoJSON';
import MVT from 'ol/format/MVT';
import { Fill, Stroke, Style } from 'ol/style';

import { labels, nonLabels } from './mapboxLayerNames';
import { lulcTileLayer, getStyle } from './lulcLayer';
import { publicUrl } from '../utils';
import HEAT_EQUITY_COLORMAP from '../../../appdata/equity_colormap.json';

const GCS_BUCKET = 'https://storage.googleapis.com/natcap-urban-online-datasets-public';
const BASE_LULC_URL = `${GCS_BUCKET}/lulc_overlay_3857.tif`;
const lulcLayer = lulcTileLayer(BASE_LULC_URL, 'Landcover', 'enviro');

const satelliteLayer = new TileLayer({
  source: new XYZ({
    url: 'https://api.mapbox.com/v4/mapbox.satellite/{z}/{x}/{y}@2x.jpg90?access_token=' + import.meta.env.VITE_DAVES_MAPBOX_TOKEN,
  }),
  visible: false,
});
satelliteLayer.set('title', 'Satellite');
satelliteLayer.set('type', 'base');

const lightMapLayer = new MapboxVectorLayer({
  styleUrl: 'mapbox://styles/mapbox/light-v10',
  accessToken: import.meta.env.VITE_DAVES_MAPBOX_TOKEN,
  visible: false,
});
lightMapLayer.set('title', 'Light Streets');
lightMapLayer.set('type', 'base');

const streetMapLayer = new MapboxVectorLayer({
  styleUrl: 'mapbox://styles/mapbox/streets-v11',
  accessToken: import.meta.env.VITE_DAVES_MAPBOX_TOKEN,
  visible: false,
  layers: nonLabels,
});
streetMapLayer.set('title', 'Streets');
streetMapLayer.set('type', 'base');

const labelLayer = new MapboxVectorLayer({
  styleUrl: 'mapbox://styles/mapbox/streets-v11',
  accessToken: import.meta.env.VITE_DAVES_MAPBOX_TOKEN,
  layers: labels,
  background: false,
});
labelLayer.set('title', 'Labels');
labelLayer.setZIndex(10);

const parcelLayer = new VectorTileLayer({
  source: new VectorTileSource({
    format: new MVT(),
    // REGRID docs suggest getting this url by first requesting
    // https://tiles.regrid.com/api/v1/parcels?token=<token>&format=mvt
    // but I don't see why we need to do that every time.
    url: `https://tiles.regrid.com/api/v1/parcels/{z}/{x}/{y}.mvt?token=${import.meta.env.VITE_REGRID_TOKEN}`
  }),
  minZoom: 15, // don't display this layer below zoom level 14
});
parcelLayer.set('title', 'Parcels');
parcelLayer.setZIndex(2);

const equitySource = new VectorSource({
  format: new GeoJSON(),
  url: publicUrl('/opt/appdata/acs_block_group_equity.geojson'),
});
const equityStroke = new Stroke({
  color: 'rgba(0, 0, 0, 0.8)',
  width: 0.5,
});

const incomeEquityLayer = new VectorLayer({
  source: equitySource,
  style: (feature) => {
    const color = HEAT_EQUITY_COLORMAP[feature.get('bivariate_income_temperature')];
    return new Style({
      fill: new Fill({
        color: color,
      }),
      stroke: equityStroke,
    });
  },
  minZoom: 9,
});
incomeEquityLayer.set('title', 'Heat-Income Equity');
incomeEquityLayer.set('type', 'enviro');
incomeEquityLayer.setOpacity(0.7);

const bipocEquityLayer = new VectorLayer({
  source: equitySource,
  style: (feature) => {
    const color = HEAT_EQUITY_COLORMAP[feature.get('bivariate_bipoc_temperature')];
    return new Style({
      fill: new Fill({
        color: color,
      }),
      stroke: equityStroke,
    });
  },
  minZoom: 9,
});
bipocEquityLayer.set('title', 'Heat-Race Equity');
bipocEquityLayer.set('type', 'enviro');
bipocEquityLayer.setOpacity(0.7);
bipocEquityLayer.setVisible(false);

const enviroLayerGroup = new LayerGroup({});
enviroLayerGroup.set('type', 'enviro-group');
enviroLayerGroup.set('title', 'Environment');
enviroLayerGroup.setZIndex(1);
enviroLayerGroup.setLayers(
  new Collection([lulcLayer, incomeEquityLayer, bipocEquityLayer])
);

export {
  satelliteLayer,
  lightMapLayer,
  streetMapLayer,
  labelLayer,
  parcelLayer,
  enviroLayerGroup,
};
