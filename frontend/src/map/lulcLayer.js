import GeoTIFF from 'ol/source/GeoTIFF';
import TileLayer from 'ol/layer/WebGLTile';

const source = new GeoTIFF({
  sources: [{
    // url: 'https://sentinel-cogs.s3.us-west-2.amazonaws.com/sentinel-s2-l2a-cogs/2020/S2A_36QWD_20200701_0_L2A/TCI.tif',
    // url: 'https://storage.googleapis.com/natcap-urban-online-datasets-public/global_dem_cog.tif',
    // projection: 'EPSG:4326',
    url: 'https://storage.googleapis.com/natcap-urban-online-datasets-public/NLCD_2016_epsg3857.tif',
    projection: 'EPSG:3857',
  }],
});

export default new TileLayer({
  source: source,
  style: {
    color: []
  }
});
