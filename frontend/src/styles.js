import { Fill, Stroke, Style } from 'ol/style';

// style for selected features in the parcel layer
export const selectedFeatureStyle = new Style({
  stroke: new Stroke({
    color: 'rgba(51, 153, 204,0.8)',
    width: 4,
  }),
  fill: new Fill({
    color: 'rgba(51, 153, 204,0.4)',
  }),
});

// style for the pattern sampler box
export const patternSamplerBoxStyle = new Style({
  stroke: new Stroke({
    width: 3,
  }),
  fill: new Fill({
    color: [255, 255, 255, 0.4],
  }),
});
