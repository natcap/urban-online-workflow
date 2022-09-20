import GeoTIFF from 'ol/source/GeoTIFF';
import TileLayer from 'ol/layer/WebGLTile';

import landuseCodes from '../landuseCodes';
import { publicUrl } from '../utils';

const colors = Array(256).fill('#000000');
Object.entries(landuseCodes).forEach(([code, data]) => {
  colors[code] = data.color;
});

export default function lulcTileLayer(url, title) {
  const source = new GeoTIFF({
    sources: [{
      url: publicUrl(url),
      projection: 'EPSG:3857',
    }],
    interpolate: false,
  });

  return new TileLayer({
    source: source,
    title: title,
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
}

