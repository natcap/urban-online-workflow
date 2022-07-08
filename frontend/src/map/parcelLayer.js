import { Fill, Stroke, Style } from 'ol/style';
import MVT from 'ol/format/MVT';
import VectorTileLayer from 'ol/layer/VectorTile';
import VectorTileSource from 'ol/source/VectorTile';


const parcelStyle = new Style({
  stroke: new Stroke({
    color: 'rgba(0, 0, 0, 0.8)',
    width: 0.3,
  }),
});

export default new VectorTileLayer({
  source: new VectorTileSource({
    format: new MVT(),
    // access API key loaded from your private .env file using dotenv package
    // because of vite, env variables are exposed through import.meta.env
    // and must be prefixed with VITE_. https://vitejs.dev/guide/env-and-mode.html#env-files
    url: 'https://api.mapbox.com/v4/emlys.san-antonio-parcels/{z}/{x}/{y}.mvt?access_token=' + import.meta.env.VITE_MAPBOX_API_KEY,
  }),
  style: parcelStyle,
  minZoom: 15, // don't display this layer below zoom level 14
});
