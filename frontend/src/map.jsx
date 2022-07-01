import React, { useEffect, useRef, useState } from 'react';

import { Map, View } from 'ol';
import { Fill, Stroke, Style } from 'ol/style';
import MVT from 'ol/format/MVT';
import OSM from 'ol/source/OSM';
import TileLayer from 'ol/layer/Tile';
import VectorTileLayer from 'ol/layer/VectorTile';
import VectorTileSource from 'ol/source/VectorTile';
import MapboxVectorLayer from 'ol/layer/MapboxVector';
import { defaults } from 'ol/control';

import { Button, Icon } from '@blueprintjs/core';

import lulcLayer from './map/lulcLayer';
import LayerPanel from './map/LayerPanel';

const styleParcel = (zoom) => {
  const style = new Style({
    stroke: new Stroke({
      color: 'rgba(0, 0, 0, 0.8)',
      width: (zoom > 18) ? 1 : 0.3,
    }),
    // even if we want no fill, must use one to enable
    // click-to-select feature
    fill: new Fill({
      color: 'rgba(0, 0, 0, 0)',
    }),
  });
  return style;
};

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
    (result, value, index, array) => {
      if (index % 2 === 0) {
        result.push(array.slice(index, index + 2));
      }
      return result;
    }, []);
  return pairedCoords;
}

export default function MapComponent(props) {
  const { setParcel } = props;
  const [layers, setLayers] = useState([]);
  const [showLayerControl, setShowLayerControl] = useState(false);
  const mapElementRef = useRef();

  const setVisibility = (lyr, visible) => {
    lyr.setVisible(visible);
  };

  const toggleLayerControl = () => {
    if (showLayerControl) {
      setShowLayerControl(false);
    } else {
      setShowLayerControl(true);
    }
  };

  // useEffect with no dependencies: only runs after first render
  useEffect(() => {
    const map = new Map({
      target: mapElementRef.current,
      view: new View({
        center: [-10964368.72, 3429876.58], // San Antonio, EPSG:3857
        projection: 'EPSG:3857',
        zoom: 19,
      }),
      controls: defaults({
        rotate: false,
        attribution: true,
      }),
    });

    // const streetMapLayer = new TileLayer({ source: new OSM() });
    const lightMapLayer = new MapboxVectorLayer({
      styleUrl: 'mapbox://styles/mapbox/light-v10',
      accessToken: import.meta.env.VITE_DAVES_MAPBOX_TOKEN,
      visible: false,
    });
    lightMapLayer.set('title', 'Light Streets');
    lightMapLayer.set('type', 'base');
    const streetMapLayer = new MapboxVectorLayer({
      styleUrl: 'mapbox://styles/mapbox/streets-v11',
      accessToken: import.meta.env.VITE_DAVES_MAPBOX_TOKEN,
    });
    streetMapLayer.set('title', 'Streets');
    streetMapLayer.set('type', 'base');
    const parcelLayer = new VectorTileLayer({
      title: 'Parcels',
      source: new VectorTileSource({
        format: new MVT(),
        // access API key loaded from your private .env file using dotenv package
        // because of vite, env variables are exposed through import.meta.env
        // and must be prefixed with VITE_. https://vitejs.dev/guide/env-and-mode.html#env-files
        url: 'https://api.mapbox.com/v4/emlys.san-antonio-parcels/{z}/{x}/{y}.mvt?access_token=' + import.meta.env.VITE_MAPBOX_API_KEY,
      }),
      style: styleParcel(map.getView().getZoom()),
      minZoom: 15, // don't display this layer below zoom level 14
    });
    let selectedFeature;
    const selectionLayer = new VectorTileLayer({
      title: 'Selected Parcels',
      renderMode: 'vector',
      source: parcelLayer.getSource(),
      style: (feature) => {
        // have to compare feature ids, not the feature objects, because tiling
        // will split some features in to multiple objects with the same id
        if (selectedFeature && feature.getId() === selectedFeature.getId()) {
          return selectedStyle;
        }
      },
    });

    map.addLayer(streetMapLayer);
    map.addLayer(lightMapLayer);
    map.addLayer(lulcLayer);
    map.addLayer(parcelLayer);
    map.addLayer(selectionLayer);
    setLayers(map.getLayers().getArray());

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
          const parcelID = feature.get('OBJECTID');
          setParcel({ id: parcelID, coords: coords });
        } else {
          selectedFeature = undefined;
        }
        selectionLayer.changed();
      });
    };
    map.on(['click'], handleClick);

    // Some layers have style dependent on zoom level
    let currentZoom = map.getView().getZoom();
    map.on(['moveend'], () => {
      const newZoom = map.getView().getZoom();
      if (currentZoom !== newZoom) {
        currentZoom = newZoom;
        parcelLayer.setStyle(styleParcel(newZoom));
      }
    });
  }, []);

  return (
    <div className="map-container">
      <div ref={mapElementRef} className="map-viewport" />
      <div className="layers-control">
        <Button
          onClick={toggleLayerControl}
        >
          <Icon icon="layers" />
        </Button>
        <LayerPanel
          show={showLayerControl}
          layers={[...layers].reverse()} // copy array & reverse it
          setVisibility={setVisibility}
        />
      </div>
    </div>
  );
}
