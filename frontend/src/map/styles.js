import { Fill, Stroke, Style } from 'ol/style';

// style for selected features in the parcel layer
export const selectedFeatureStyle = new Style({
  stroke: new Stroke({
    color: 'rgba(51, 153, 204, 0.8)',
    width: 4,
  }),
  fill: new Fill({
    color: 'rgba(0, 0, 0, 0.0)',
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

// dynamic style function for parcels
export function styleParcel(zoom) {
  const style = new Style({
    stroke: new Stroke({
      color: 'rgba(255, 255, 255, 0.8)',
      width: (zoom > 18) ? 1 : 0.7,
    }),
    // even if we want no fill, must use one to enable
    // click-to-select feature
    fill: new Fill({
      color: 'rgba(0, 0, 0, 0)',
    }),
  });
  return style;
}
