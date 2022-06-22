import GeoTIFF from 'ol/source/GeoTIFF';
import TileLayer from 'ol/layer/WebGLTile';

import lulcColors from './lulcColors';

const source = new GeoTIFF({
  sources: [{
    // url: 'https://storage.googleapis.com/natcap-urban-online-datasets-public/NLCD_2016_epsg3857.tif',
    // projection: 'EPSG:3857',
    url: '/nlcd_extract.tif',
    projection: 'EPSG:3857',
  }],
  interpolate: false,
});

export default new TileLayer({
  source: source,
  style: {
    // https://openlayers.org/en/latest/apidoc/module-ol_style_expressions.html#~ExpressionValue
    // https://github.com/openlayers/openlayers/blob/main/test/rendering/cases/webgl-palette/main.js
    color: [
      'palette',
      ['*', ['band', 1], 255],
      lulcColors,
    ]
  }
});
