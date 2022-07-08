import React, { useEffect, useRef, useState } from 'react';

import { Map, View } from 'ol';
import MVT from 'ol/format/MVT';
import VectorTileLayer from 'ol/layer/VectorTile';
import VectorTileSource from 'ol/source/VectorTile';
import { Vector as VectorSource } from 'ol/source';
import { Vector as VectorLayer } from 'ol/layer';
import WKT from 'ol/format/WKT';
import Feature from 'ol/Feature';
import { Polygon } from 'ol/geom';
import {
  Translate,
  defaults as defaultInteractions,
} from 'ol/interaction';
import { defaults } from 'ol/control';
import { Fill, Stroke, Style } from 'ol/style';

import { Button, Icon } from '@blueprintjs/core';

import lulcLayer from './map/lulcLayer';
import LayerPanel from './map/LayerPanel';
import {
  satelliteLayer,
  streetMapLayer,
  labelLayer,
} from './map/baseLayers';
import {
  selectedFeatureStyle,
  patternSamplerBoxStyle
} from './map/styles';

const styleParcel = (zoom) => {
  const style = new Style({
    stroke: new Stroke({
      color: 'rgba(255, 255, 255, 0.8)',
      width: (zoom > 18) ? 1 : 0.7,
    }),
    // even if we want no fill, must use one to enable
    // click-to-select feature
    fill: new Fill({
      color: 'rgba(0, 0, 0, 0)',
    }),
  });
  return style;
};

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
  const width = 200; // box dimensions in map CRS units
  return new Polygon([
    [
      [centerX - width / 2, centerY - width / 2],
      [centerX - width / 2, centerY + width / 2],
      [centerX + width / 2, centerY + width / 2],
      [centerX + width / 2, centerY - width / 2],
      [centerX - width / 2, centerY - width / 2],
    ],
  ]);
}

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

const parcelLayer = new VectorTileLayer({
  source: new VectorTileSource({
    format: new MVT(),
    // access API key loaded from your private .env file using dotenv package
    // because of vite, env variables are exposed through import.meta.env
    // and must be prefixed with VITE_. https://vitejs.dev/guide/env-and-mode.html#env-files
    url: 'https://api.mapbox.com/v4/emlys.san-antonio-parcels/{z}/{x}/{y}.mvt?access_token=' + import.meta.env.VITE_MAPBOX_API_KEY,
  }),
  minZoom: 15, // don't display this layer below zoom level 14
});
parcelLayer.set('title', 'Parcels');

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
selectionLayer.set('title', 'Selected Parcels');

// define the map
const map = new Map({
  layers: [
    satelliteLayer,
    streetMapLayer,
    lulcLayer,
    parcelLayer,
    selectionLayer,
    patternSamplerLayer,
    labelLayer,
  ],
  view: new View({
    center: [-10984368.72, 3427876.58], // W. San Antonio, EPSG:3857
    zoom: 16,
  }),
  interactions: defaultInteractions().extend([translate]),
  controls: defaults({
    rotate: false,
    attribution: true,
  }),
});

export default function MapComponent(props) {
  const { setParcel, patternSamplingMode, setPatternSampleWKT } = props;
  const [layers, setLayers] = useState([]);
  const [showLayerControl, setShowLayerControl] = useState(false);
  const [basemap, setBasemap] = useState('Satellite');
  // refs for elements to insert openlayers-controlled nodes into the dom
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

  const switchBasemap = (title) => {
    layers.forEach((layer) => {
      if (layer.get('type') === 'base') {
        setVisibility(layer, layer.get('title') === title);
      }
    });
    setBasemap(title);
  };

  // useEffect with no dependencies: only runs after first render
  useEffect(() => {
    map.setTarget(mapElementRef.current);
    setLayers(map.getLayers().getArray());
    parcelLayer.setStyle(styleParcel(map.getView().getZoom()));

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

    map.on(['click'], async (event) => {
      parcelLayer.getFeatures(event.pixel).then((features) => {
        const feature = features.length ? features[0] : undefined;
        let coords;
        if (feature) {
          // NOTE that a feature's geometry can change with the tile/zoom level and view position
          // and so its coordinates will change slightly.
          // for best precision, maybe don't get the coordinates on the client side
          coords = getCoords(feature);
        }
        selectedFeature = feature;
        selectionLayer.changed();
        setParcel({ coords: coords });
      });
    });

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

  // toggle pattern sampler visibility according to the pattern sampling mode
  useEffect(() => {
    if (patternSamplerLayer) {
      if (patternSamplingMode) {
        switchBasemap('Landcover');
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
          switchBasemap={switchBasemap}
          basemap={basemap}
        />
      </div>
    </div>
  );
}
