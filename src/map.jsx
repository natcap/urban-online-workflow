import { Map, View } from 'ol';
import { Fill, Stroke, Style } from 'ol/style';
import MVT from 'ol/format/MVT';
import OSM from 'ol/source/OSM';
import React from 'react';
import TileLayer from 'ol/layer/Tile';
import VectorTileLayer from 'ol/layer/VectorTile';
import VectorTileSource from 'ol/source/VectorTile';


export default class MapComponent extends React.PureComponent {

  constructor(props) {
    super(props);
    this.mapContainer = React.createRef();
  }

  componentDidMount() {

    const parcelLayer = new VectorTileLayer({
      source: new VectorTileSource({
        format: new MVT(),
        // access API key loaded from your private .env file using dotenv package
        // because of vite, env variables are exposed through import.meta.env
        // and must be prefixed with VITE_. https://vitejs.dev/guide/env-and-mode.html#env-files
        url: 'https://api.mapbox.com/v4/emlys.san-antonio-parcels/{z}/{x}/{y}.mvt?access_token=' + import.meta.env.VITE_MAPBOX_API_KEY,
      }),
      minZoom: 13  // don't display this layer below zoom level 14
    })

    const map = new Map({
      target: this.mapContainer.current,
      layers: [
        new TileLayer({
          source: new OSM()
        }),
        parcelLayer
      ],
      view: new View({
        center: [-10964368.72, 3429876.58], // San Antonio coords in the default view projection, EPSG:3857
        zoom: 16
      })
    });

    const selectedStyle = new Style({
      stroke: new Stroke({
        color: 'rgba(51, 153, 204,0.8)',
        width: 4,
      }),
      fill: new Fill({
        color: 'rgba(51, 153, 204,0.4)',
      }),
    });

    // Set up to display selected features
    let selection;
    const selectionLayer = new VectorTileLayer({
      map: map,
      renderMode: 'vector',
      source: parcelLayer.getSource(),
      style: function (feature) {
        if (feature.getId() === selection) {
          return selectedStyle;
        }
      },
    });

    // On click, visually select the clicked feature
    // and log the coordinates of its geometry
    map.on(['click'], function (event) {
      parcelLayer.getFeatures(event.pixel).then(function (features) {
        const feature = features.length ? features[0] : undefined;
        if (feature) {
          selection = feature.getId();
          // NOTE that a feature's geometry can change with the tile/zoom level and view position
          // and so its coordinates will change slightly.
          // for best precision, maybe don't get the coordinates on the client side
          const flatCoords = features[0].getGeometry().getFlatCoordinates();
          const pairedCoords = flatCoords.reduce(
            function(result, value, index, array) {
              if (index % 2 === 0)
                result.push(array.slice(index, index + 2));
              return result;
            }, []);
          console.log('OBJECTID:', features[0].get('OBJECTID'), 'geometry:', pairedCoords);
        } else {
          selection = undefined;
        }
        selectionLayer.changed();
      });
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
