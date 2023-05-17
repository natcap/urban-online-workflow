import GeoTIFF from 'ol/source/GeoTIFF';
import TileLayer from 'ol/layer/WebGLTile';
import ImageLayer from 'ol/layer/Image';

import landuseCodes from '../../../appdata/NLCD_2016.lulcdata.json';
import { publicUrl } from '../utils';

const colors = Array(256).fill('#000000');
Object.entries(landuseCodes).forEach(([code, data]) => {
  colors[code] = data.color;
});

export function lulcTileLayer(url, title, type, sourceOptions) {
  const source = new GeoTIFF({
    sources: [{
      url: publicUrl(url),
      projection: 'EPSG:3857',
    }],
    interpolate: false,
    sourceOptions: sourceOptions,
  });

  return new TileLayer({
    source: source,
    title: title,
    type: type,
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
      saturation: -0.5,
      contrast: 0.0,
    },
  });
}

// TODO: unused
export function lulcImageLayer(url, title) {
  const source = new GeoTIFF({
    sources: [{
      url: publicUrl(url),
      projection: 'EPSG:3857',
    }],
    interpolate: false,
  });

  return new ImageLayer({
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

