import GeoTIFF from 'ol/source/GeoTIFF';
import TileLayer from 'ol/layer/WebGLTile';

import landuseCodes from '../../../appdata/lulc_crosswalk.json';
import { publicUrl } from '../utils';

const nlcdColors = Array(3000).fill('#000000');
const nludColors = Array(3000).fill('#000000');
const treeColors = Array(3000).fill('#000000');
Object.entries(landuseCodes).forEach(([code, data]) => {
  nlcdColors[code] = data.nlcd.color;
});
Object.entries(landuseCodes).forEach(([code, data]) => {
  nludColors[code] = data.nlud.color;
});
Object.entries(landuseCodes).forEach(([code, data]) => {
  treeColors[code] = data.tree.color;
});

// keys here match 'title' passed to lulcTileLayer
const COLORMAPS = {
  'nlcd': nlcdColors,
  'nlud': nludColors,
  'tree': treeColors,
};

export function getStyle(lulcType) {
  // https://openlayers.org/en/latest/apidoc/module-ol_style_expressions.html#~ExpressionValue
  // https://github.com/openlayers/openlayers/blob/main/test/rendering/cases/webgl-palette/main.js
  return {
    color: [
      // the GeoTIFF source reads the nodata value from the file
      // and creates band 2 for use as alpha values.
      // https://github.com/openlayers/openlayers/issues/13588#issuecomment-1125317573
      'case',
      ['==', ['band', 2], 0],
      '#00000000',
      [
        'palette',
        ['band', 1],
        COLORMAPS[lulcType],
      ],
    ],
    saturation: -0.5,
    contrast: 0.0,
  };
}

export function lulcTileLayer(url, title, type, sourceOptions) {
  const source = new GeoTIFF({
    sources: [{
      url: publicUrl(url),
      projection: 'EPSG:3857',
      // nodata: -1,
    }],
    interpolate: false,
    normalize: false,
    sourceOptions: sourceOptions,
  });

  return new TileLayer({
    source: source,
    title: title,
    type: type,
    visible: false,
    style: getStyle('nlcd')
  });
}
