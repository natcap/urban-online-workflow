import { Map, View } from 'ol';
import MVT from 'ol/format/MVT';
import OSM from 'ol/source/OSM';
import React, { useEffect, useRef, useState } from 'react';
import TileLayer from 'ol/layer/Tile';
import VectorTileLayer from 'ol/layer/VectorTile';
import VectorTileSource from 'ol/source/VectorTile';
import { Vector as VectorSource } from 'ol/source';
import { Vector as VectorLayer } from 'ol/layer';
import WKT from 'ol/format/WKT';
import Feature from 'ol/Feature';
import { Polygon } from 'ol/geom';
import {
  Select,
  Translate,
  defaults as defaultInteractions,
} from 'ol/interaction';

import {selectedFeatureStyle, patternSamplerBoxStyle} from './styles';

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

function centeredPatternSamplerGeom(centerX, centerY) {
  const width = 100; // box dimensions in map CRS units
  return new Polygon([
    [
      [centerX - width / 2, centerY - width / 2],
      [centerX - width / 2, centerY + width / 2],
      [centerX + width / 2, centerY + width / 2],
      [centerX + width / 2, centerY - width / 2],
      [centerX - width / 2, centerY - width / 2],
    ],
  ])
}

// define map layers
const streetMapLayer = new TileLayer({ source: new OSM() });
const parcelLayer = new VectorTileLayer({
  source: new VectorTileSource({
    format: new MVT(),
    // access API key loaded from your private .env file using dotenv package
    // because of vite, env variables are exposed through import.meta.env
    // and must be prefixed with VITE_. https://vitejs.dev/guide/env-and-mode.html#env-files
    url: 'https://api.mapbox.com/v4/emlys.san-antonio-parcels/{z}/{x}/{y}.mvt?access_token=' + import.meta.env.VITE_MAPBOX_API_KEY,
  }),
  minZoom: 18, // don't display this layer below zoom level 17
});

const patternSamplerFeature = new Feature();
const patternSamplerLayer = new VectorLayer({
  source: new VectorSource({
    features: [
      patternSamplerFeature,
    ],
  }),
  style: patternSamplerBoxStyle,
  visible: false,
});

const wkt = new WKT();
const translate = new Translate({
  layers: [patternSamplerLayer],
});

let selectedFeature = null;

const selectionLayer = new VectorTileLayer({
  renderMode: 'vector',
  source: parcelLayer.getSource(),
  style: (feature) => {
    // have to compare feature ids, not the feature objects, because tiling
    // will split some features in to multiple objects with the same id
    if (selectedFeature && feature.getId() === selectedFeature.getId()) {
      return selectedFeatureStyle;
    }
  },
});

// define the map
const map = new Map({
  layers: [
    streetMapLayer,
    parcelLayer,
    selectionLayer,
    patternSamplerLayer,
  ],
  view: new View({
    center: [-10964368.72, 3429876.58], // San Antonio, EPSG:3857
    zoom: 19,
  }),
  interactions: defaultInteractions().extend([translate]),
});

export default function MapComponent(props) {
  const { setParcel, patternSamplingMode, setPatternSampleWKT } = props;
  // refs for elements to insert openlayers-controlled nodes into the dom
  const mapElementRef = useRef();

  // useEffect with no dependencies: only runs after first render
  useEffect(() => {
    map.setTarget(mapElementRef.current);

    // when the box appears, or when the user finishes dragging the box,
    // update state with its new location
    translate.on(
      'translateend',
      () => setPatternSampleWKT(wkt.writeFeature(patternSamplerFeature))
    );
    patternSamplerLayer.on(
      'change:visible',
      () => setPatternSampleWKT(wkt.writeFeature(patternSamplerFeature))
    );

    // map click handler: visually select the clicked feature and save info in state
    map.on(['click'], async (event) => {
      parcelLayer.getFeatures(event.pixel).then((features) => {
        const feature = features.length ? features[0] : undefined;
        let coords = undefined;
        if (feature) {
          // NOTE that a feature's geometry can change with the tile/zoom level and view position
          // and so its coordinates will change slightly.
          // for best precision, maybe don't get the coordinates on the client side
          coords = getCoords(feature);
        }
        selectedFeature = feature;
        selectionLayer.changed();
        setParcel({coords: coords});
      });
    });
  }, []);

  // toggle pattern sampler visibility according to the pattern sampling mode
  useEffect(() => {
    if (patternSamplerLayer) {
      if (patternSamplingMode) {
        // when pattern sampling mode is turned on,
        // recenter the sampler box in the current view
        const [mapCenterX, mapCenterY] = map.getView().getCenter();
        patternSamplerFeature.setGeometry(
          centeredPatternSamplerGeom(mapCenterX, mapCenterY)
        );
      }
      patternSamplerLayer.setVisible(patternSamplingMode);
    }
  }, [patternSamplingMode]);

  // render component
  return (
    <div className="map-container">
      <div ref={mapElementRef} className="map-viewport" />
    </div>
  );
}
