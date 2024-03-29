import GeoTIFF from 'ol/source/GeoTIFF';
import TileLayer from 'ol/layer/WebGLTile';

import { publicUrl } from '../utils';
import landuseCodes from '../../../appdata/lulc_crosswalk.json';
import nlcdLookup from '../../../appdata/nlcd_colormap.json';
import nludLookup from '../../../appdata/nlud_colormap.json';
import treeLookup from '../../../appdata/tree_colormap.json';

// landuseCodes range from 0 to 2400, allow 3000 indices.
const nlcdColors = Array(3000).fill('#000000');
const nludColors = Array(3000).fill('#000000');
const treeColors = Array(3000).fill('#000000');
Object.entries(landuseCodes).forEach(([code, data]) => {
  nlcdColors[code] = nlcdLookup[data.nlcd].color;
});
Object.entries(landuseCodes).forEach(([code, data]) => {
  nludColors[code] = nludLookup[data.nlud].color;
});
Object.entries(landuseCodes).forEach(([code, data]) => {
  treeColors[code] = treeLookup[data.tree].color;
});

const COLORMAPS = {
  nlcd: nlcdColors,
  nlud: nludColors,
  tree: treeColors,
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
    style: getStyle('nlcd'),
  });
}
