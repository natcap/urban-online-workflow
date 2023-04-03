import React, { useEffect, useRef, useState } from 'react';

import { Map, View } from 'ol';
import Collection from 'ol/Collection';
import LayerGroup from 'ol/layer/Group';
import { Vector as VectorLayer } from 'ol/layer';
import VectorTileLayer from 'ol/layer/VectorTile';
import VectorTileSource from 'ol/source/VectorTile';
import { Vector as VectorSource } from 'ol/source';
import MVT from 'ol/format/MVT';
import WKT from 'ol/format/WKT';
import Feature from 'ol/Feature';
import { Polygon } from 'ol/geom';
import {
  Translate,
  defaults as defaultInteractions,
} from 'ol/interaction';
import { defaults } from 'ol/control';

import { Button, Icon } from '@blueprintjs/core';

import ParcelControl from './parcelControl';
import { lulcTileLayer } from './lulcLayer';
import LayerPanel from './LayerPanel';
import {
  satelliteLayer,
  streetMapLayer,
  labelLayer,
} from './baseLayers';
import {
  selectedFeatureStyle,
  patternSamplerBoxStyle,
  styleParcel,
} from './styles';

const BASE_LULC_URL = 'https://storage.googleapis.com/natcap-urban-online-datasets-public/NLCD_2016_epsg3857.tif'
const GEOTIFF_SOURCE_OPTIONS = {
  allowFullFile: true,
  blockSize: 256,
  maxRanges: 1, // doesn't seem to work as advertised
  headers: {
    // 'range' is case-sensitive, despite the fact that browser & docs
    // capitalize 'Range'.
    // 'range': 'bytes=0-3356',
  }
}

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
patternSamplerLayer.setZIndex(5);

const wktFormat = new WKT();
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
parcelLayer.setZIndex(2);

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
selectionLayer.setZIndex(3);

const studyAreaSource = new VectorSource({});
const studyAreaLayer = new VectorLayer({
  source: studyAreaSource
});
studyAreaLayer.set('title', 'Study Area');
studyAreaLayer.setZIndex(3);

const scenarioLayerGroup = new LayerGroup({
  properties: { group: 'scenarios' }
});
scenarioLayerGroup.setZIndex(1);

const map = new Map({
  layers: [
    satelliteLayer,
    streetMapLayer,
    lulcTileLayer(BASE_LULC_URL, 'Landcover', 'base'),
    parcelLayer,
    selectionLayer,
    patternSamplerLayer,
    labelLayer,
    scenarioLayerGroup,
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
  const {
    sessionID,
    parcelSet,
    activeStudyAreaID,
    refreshStudyArea,
    patternSamplingMode,
    setPatternSampleWKT,
    scenarios,
  } = props;
  const [layers, setLayers] = useState([]);
  const [showLayerControl, setShowLayerControl] = useState(false);
  const [selectedBasemap, setSelectedBasemap] = useState('Satellite');
  const [selectedParcel, setSelectedParcel] = useState(null);
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
    setSelectedBasemap(title);
  };

  const switchScenario = (title) => {
    layers.forEach((layer) => {
      if (layer.get('group') === 'scenarios') {
        layer.getLayers().forEach(lyr => {
          setVisibility(lyr, lyr.get('title') === title);
        });
      }
    });
  };

  const clearSelection = () => {
    // It feels kinda weird to have selectedFeature outside
    // React scope, but it works.
    selectedFeature = null;
    selectionLayer.changed();
    setSelectedParcel(null);
  };

  // useEffect with no dependencies: only runs after first render
  useEffect(() => {
    map.setTarget(mapElementRef.current);
    setLayers(map.getLayers().getArray());
    switchBasemap('Satellite');
    parcelLayer.setStyle(styleParcel(map.getView().getZoom()));

    // when the box appears, or when the user finishes dragging the box,
    // update state with its new location
    translate.on(
      'translateend',
      () => setPatternSampleWKT(wktFormat.writeFeature(patternSamplerFeature)),
    );
    patternSamplerLayer.on(
      'change:visible',
      () => setPatternSampleWKT(wktFormat.writeFeature(patternSamplerFeature)),
    );

    map.on(['click'], async (event) => {
      parcelLayer.getFeatures(event.pixel).then(async (features) => {
        let coords;
        const feature = features.length ? features[0] : undefined;
        if (feature) {
          // NOTE that a feature's geometry can change with the tile/zoom level and view position
          // and so its coordinates will change slightly.
          // for best precision, maybe don't get the coordinates on the client side
          coords = getCoords(feature);
        }
        selectedFeature = feature;
        selectionLayer.changed();
        setSelectedParcel({
          parcelID: feature.properties_.OBJECTID,
          address: feature.properties_.address,
          coords: coords,
        });
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

  // useEffect(() => {
  //   if (parcelSet.length) {
  //     const features = parcelSet.forEach(parcel => {
  //       const feature = wktFormat.readFeature(parcel.wkt, {
  //         dataProjection: 'EPSG:3857',
  //         featureProjection: 'EPSG:3857',
  //       });
  //       return feature;
  //     });
  //     studyAreaSource.addFeatures()
  //   }
  // })

  useEffect(() => {
    // A naive approach where we don't need to know if scenarios changed
    // because a new one was created, or because the study area was switched.
    map.removeLayer(scenarioLayerGroup);
    if (scenarios.length) {
      const scenarioLayers = [];
      scenarios.forEach((scene) => {
        scenarioLayers.push(
          lulcTileLayer(scene.lulc_url_result, scene.name, 'scenario')
        );
      });
      scenarioLayerGroup.setLayers(new Collection(scenarioLayers));
      map.addLayer(scenarioLayerGroup);
      setLayers(map.getLayers().getArray());
    }
  }, [scenarios]);

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
          switchScenario={switchScenario}
          basemap={selectedBasemap}
        />
      </div>
      <ParcelControl
        sessionID={sessionID}
        activeStudyAreaID={activeStudyAreaID}
        parcel={selectedParcel}
        clearSelection={clearSelection}
        refreshStudyArea={refreshStudyArea}
      />
    </div>
  );
}
