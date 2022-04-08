import { Map, View } from 'ol';
import { Fill, Stroke, Style } from 'ol/style';
import MVT from 'ol/format/MVT';
import OSM from 'ol/source/OSM';
import Overlay from 'ol/Overlay';
import React, { useState, useEffect, useRef } from 'react';
import TileLayer from 'ol/layer/Tile';
import VectorTileLayer from 'ol/layer/VectorTile';
import VectorTileSource from 'ol/source/VectorTile';

import Popup from './popup';
import { getParcelInfo } from './requests';

// style for selected features
const selectedStyle = new Style({
  stroke: new Stroke({
    color: 'rgba(51, 153, 204,0.8)',
    width: 4,
  }),
  fill: new Fill({
    color: 'rgba(51, 153, 204,0.4)',
  }),
});

function getCoords(geometry) {
  const flatCoords = geometry.getFlatCoordinates();
  const pairedCoords = flatCoords.reduce(
    function(result, value, index, array) {
      if (index % 2 === 0)
        result.push(array.slice(index, index + 2));
      return result;
    }, []);
  return pairedCoords;
}

export default function MapComponent(props) {

  const [popup, setPopup] = useState(undefined);

  // element refs: used to insert openlayers-controlled nodes into the dom
  const mapElementRef = useRef();
  const overlayElementRef = useRef();

  // object refs: used to pass values to child components
  const overlayRef = useRef()

  // initialize map on first render - logic formerly put into componentDidMount
  useEffect(() => {

    // Create an overlay to anchor the popup to the map.
    const overlay = new Overlay({
      element: overlayElementRef.current,
      autoPan: {
        animation: {
          duration: 250,
        },
      },
    });
    overlayRef.current = overlay

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

    let selectedFeature;
    // Set up to display selected features
    const selectionLayer = new VectorTileLayer({
      renderMode: 'vector',
      source: parcelLayer.getSource(),
      style: function (feature) {
        // have to compare feature ids, not the feature objects, because tiling
        // will split some features in to multiple objects with the same id
        if (selectedFeature && feature.getId() === selectedFeature.getId()) {
          return selectedStyle;
        }
      },
    });

    const map = new Map({
      target: mapElementRef.current,
      layers: [
        new TileLayer({
          source: new OSM()
        }),
        parcelLayer,
        selectionLayer
      ],
      overlays: [overlay],
      view: new View({
        center: [-10964368.72, 3429876.58], // San Antonio coords in the default view projection, EPSG:3857
        zoom: 16
      })
    });

    let popup = <React.Fragment />;
    const handleClick = async (event) => {
      await parcelLayer.getFeatures(event.pixel).then(async function (features) {
        const feature = features.length ? features[0] : undefined;
        if (feature) {
          selectedFeature = feature;
          // NOTE that a feature's geometry can change with the tile/zoom level and view position
          // and so its coordinates will change slightly.
          // for best precision, maybe don't get the coordinates on the client side
          console.log('Selected feature coordinates:', getCoords(feature));

          const parcelID = feature.get('OBJECTID');
          const parcelInfo = await getParcelInfo(parcelID);
          const message = `<p>You clicked on parcel ${parcelID}</p> Info: ${parcelInfo}`;
          popup = (
            <Popup
              location={event.coordinate}
              message={message}
              overlay={overlayRef.current} />
          );
        } else {
          selectedFeature = undefined;
          popup = <React.Fragment />;
        }
        selectionLayer.changed();
        setPopup(popup);
      });
    }
    // On click, visually select the clicked feature
    // and log the coordinates of its geometry
    map.on(['click'], handleClick);

  }, []);

  // render component
  return (
    <div>
      <div ref={mapElementRef} className="map-container" />
      <div ref={overlayElementRef} id="popup" className="ol-popup">
        { popup }
      </div>
    </div>
  );
}
