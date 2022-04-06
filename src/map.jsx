import { Map, View } from 'ol';
import MVT from 'ol/format/MVT';
import TileLayer from 'ol/layer/Tile';
import VectorTileLayer from 'ol/layer/VectorTile';
import VectorTileSource from 'ol/source/VectorTile';
import OSM from 'ol/source/OSM';
import React from 'react';


export default class MapComponent extends React.PureComponent {

  constructor(props) {
    super(props);
    this.mapContainer = React.createRef();
  }

  componentDidMount() {
    const map = new Map({
      target: this.mapContainer.current,
      layers: [
        new TileLayer({
          source: new OSM()
        }),
        new VectorTileLayer({
          source: new VectorTileSource({
            format: new MVT(),
            // access API key loaded from your private .env file using dotenv package
            // because of vite, env variables are exposed through import.meta.env
            // and must be prefixed with VITE_. https://vitejs.dev/guide/env-and-mode.html#env-files
            url: 'https://api.mapbox.com/v4/emlys.san-antonio-parcels/{z}/{x}/{y}.mvt?access_token=' + import.meta.env.VITE_MAPBOX_API_KEY
          }),
        }),
      ],
      view: new View({
        center: [-10964368.72, 3429876.58], // San Antonio coords in the default view projection, EPSG:3857
        zoom: 12
      })
    });
  }

  render() {
    return (
      <div>
        <div ref={this.mapContainer} className="map-container" />
      </div>
    );
  }
}
