import XYZ from 'ol/source/XYZ';
import TileLayer from 'ol/layer/Tile';
import MapboxVectorLayer from 'ol/layer/MapboxVector';
import VectorTileLayer from 'ol/layer/VectorTile';
import VectorTileSource from 'ol/source/VectorTile';
import MVT from 'ol/format/MVT';

import { labels, nonLabels } from './mapboxLayerNames';

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

export {
  satelliteLayer,
  lightMapLayer,
  streetMapLayer,
  labelLayer,
  parcelLayer,
};
