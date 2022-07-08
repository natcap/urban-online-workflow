import XYZ from 'ol/source/XYZ';
import TileLayer from 'ol/layer/Tile';
import MapboxVectorLayer from 'ol/layer/MapboxVector';

import { labels, nonLabels } from './mapboxLayerNames';

const satelliteLayer = new TileLayer({
  source: new XYZ({
    url: 'https://api.mapbox.com/v4/mapbox.satellite/{z}/{x}/{y}@2x.jpg90?access_token=' + import.meta.env.VITE_DAVES_MAPBOX_TOKEN,
  }),
  visible: true,
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

export {
  satelliteLayer,
  lightMapLayer,
  streetMapLayer,
  labelLayer,
};
