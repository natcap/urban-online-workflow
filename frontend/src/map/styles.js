import { Fill, Stroke, Style, Text } from 'ol/style';

const highlightedStrokeColor = 'rgba(3, 186, 252, 0.8)'

// style for parcels while hovering over study area table
export const hoveredFeatureStyle = new Style({
  stroke: new Stroke({
    color: highlightedStrokeColor,
    width: 5,
  }),
  fill: new Fill({
    color: 'rgba(250, 250, 250, 0.2)',
  }),
});

// style for selected features in the parcel layer
export const selectedFeatureStyle = new Style({
  stroke: new Stroke({
    color: highlightedStrokeColor,
    width: 3,
    lineDash: [5, 5],
  }),
  fill: new Fill({
    color: 'rgba(250, 250, 250, 0.2)',
  }),
});

// style for parcels in study area
export const studyAreaStyle = new Style({
  stroke: new Stroke({
    color: highlightedStrokeColor,
    width: 3,
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

export function styleServiceshed(feature, label) {
  const style = new Style({
    stroke: new Stroke({
      color: 'rgba(255, 255, 255, 0.8)',
      width: 3,
      lineDash: [5, 5],
    }),
    text: new Text({
      text: label,
      font: 'bold 18px "Open Sans", "Arial Unicode MS", "sans-serif"',
      placement: 'line',
      fill: new Fill({ color: 'white' }),
      textBaseline: 'bottom',
      maxAngle: 1,
      textAlign: 'center'
    }),
  });
  return style;
}

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
