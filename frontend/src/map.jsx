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

  const { toggleEditMenu, setSelectedParcel } = props;
  const [popupInfo, setPopupInfo] = useState(null);
  // refs for elements to insert openlayers-controlled nodes into the dom
  const mapElementRef = useRef();
  const overlayElementRef = useRef();
  // use ref for the overlay object to make it available across renders
  const overlayRef = useRef()

  // useEffect with no dependencies: only runs after first render
  useEffect(() => {
    // define map layers
    const streetMapLayer = new TileLayer({ source: new OSM() })
    const parcelLayer = new VectorTileLayer({
      source: new VectorTileSource({
        format: new MVT(),
        // access API key loaded from your private .env file using dotenv package
        // because of vite, env variables are exposed through import.meta.env
        // and must be prefixed with VITE_. https://vitejs.dev/guide/env-and-mode.html#env-files
        url: 'https://api.mapbox.com/v4/emlys.san-antonio-parcels/{z}/{x}/{y}.mvt?access_token=' + import.meta.env.VITE_MAPBOX_API_KEY,
      }),
      minZoom: 18  // don't display this layer below zoom level 17
    })
    let selectedFeature;
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

    // define map overlay: needed to anchor the popup to the map
    const overlay = new Overlay({
      element: overlayElementRef.current,
      autoPan: {
        animation: {
          duration: 250,
        },
      }
    });
    overlayRef.current = overlay;

    // define the map
    const map = new Map({
      target: mapElementRef.current,
      layers: [
        streetMapLayer,
        parcelLayer,
        selectionLayer
      ],
      overlays: [overlay],
      view: new View({
        center: [-10964368.72, 3429876.58], // San Antonio coords in the default view projection, EPSG:3857
        zoom: 19
      })
    });

    // map click handler: visually select the clicked feature and save info in state
    const handleClick = async (event) => {
      await parcelLayer.getFeatures(event.pixel).then(async (features) => {
        const feature = features.length ? features[0] : undefined;
        if (feature) {
          selectedFeature = feature;
          // NOTE that a feature's geometry can change with the tile/zoom level and view position
          // and so its coordinates will change slightly.
          // for best precision, maybe don't get the coordinates on the client side
          const coords = getCoords(feature);
          console.log('Selected feature coordinates:', coords);

          const parcelID = feature.get('OBJECTID');
          // const lulcTable = await getLULCInParcel(parcelID, coords);
          const message = `You clicked on parcel ${parcelID}`;
          setPopupInfo({
            location: event.coordinate,
            message: message,
          });
          setSelectedParcel(coords);
        } else {
          selectedFeature = undefined;
          setPopupInfo(null);
        }
        selectionLayer.changed();
      });
    };
    map.on(['click'], handleClick);
  }, []);

  // useEffect with popupInfo dependency: runs when popupInfo changes
  useEffect(() => {
    // set location of the overlay popup
    overlayRef.current.setPosition(popupInfo ? popupInfo.location : null);
  }, [popupInfo]);

  // pre-render logic
  let popup = <React.Fragment />;
  if (popupInfo) {
    popup = (
      <Popup
        message={popupInfo.message}
        handleClose={() => overlayRef.current.setPosition(undefined)}
        toggleEditMenu={toggleEditMenu} />
    );
  }

  // render component
  return (
    <div className="map-container">
      <div ref={mapElementRef} className="map-container" />
      <div ref={overlayElementRef} id="popup" className="ol-popup">
        { popup }
      </div>
    </div>
  );
}
