import GeoTIFF from 'ol/source/GeoTIFF';
import TileLayer from 'ol/layer/WebGLTile';

import landuseCodes from '../landuseCodes';

const colors = Array(256).fill('#000000');
Object.entries(landuseCodes).forEach(([code, data]) => {
  colors[code] = data.color;
});

const source = new GeoTIFF({
  sources: [{
    url: 'https://storage.googleapis.com/natcap-urban-online-datasets-public/NLCD_2016_epsg3857.tif',
    projection: 'EPSG:3857',
  }],
  interpolate: false,
});

export default new TileLayer({
  source: source,
  title: 'Landcover',
  type: 'base',
  visible: false,
  style: {
    // https://openlayers.org/en/latest/apidoc/module-ol_style_expressions.html#~ExpressionValue
    // https://github.com/openlayers/openlayers/blob/main/test/rendering/cases/webgl-palette/main.js
    color: [
      'palette',
      // band values now in rgb-space; *255 to get original values
      ['*', ['band', 1], 255],
      colors,
    ],
    saturation: -0.3,
    contrast: -0.4,
  }
});
