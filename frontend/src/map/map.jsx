import React, { useEffect, useRef, useState } from 'react';

import { Map, View } from 'ol';
import Collection from 'ol/Collection';
import LayerGroup from 'ol/layer/Group';
import { Vector as VectorLayer } from 'ol/layer';
import VectorTileLayer from 'ol/layer/VectorTile';
import VectorTileSource from 'ol/source/VectorTile';
import { Vector as VectorSource } from 'ol/source';
import GeoJSON from 'ol/format/GeoJSON';
import MVT from 'ol/format/MVT';
import WKT from 'ol/format/WKT';
import Feature from 'ol/Feature';
import {
  Point,
  LineString,
  LinearRing,
  Polygon,
  MultiPoint,
  MultiLineString,
  MultiPolygon,
} from 'ol/geom';
import {
  Translate,
  defaults as defaultInteractions,
} from 'ol/interaction';
import { defaults } from 'ol/control';

import OL3Parser from 'jsts/org/locationtech/jts/io/OL3Parser';
import WKTWriter from 'jsts/org/locationtech/jts/io/WKTWriter';
import OverlayOp from 'jsts/org/locationtech/jts/operation/overlay/OverlayOp';

import { Button, Icon } from '@blueprintjs/core';

import ParcelControl from './parcelControl';
import LegendControl from './legendControl';
import { lulcTileLayer, getStyle } from './lulcLayer';
import LayerPanel from './LayerPanel';
import {
  satelliteLayer,
  streetMapLayer,
  labelLayer,
  parcelLayer,
} from './baseLayers';
import {
  hoveredFeatureStyle,
  patternSamplerBoxStyle,
  selectedFeatureStyle,
  studyAreaStyle,
  styleParcel,
  styleServiceshed,
} from './styles';

import { publicUrl } from '../utils';
import {
  COOLING_DISTANCE_STR,
  NATURE_ACCESS_DISTANCE_STR,
} from '../constants';

const GCS_BUCKET = 'https://storage.googleapis.com/natcap-urban-online-datasets-public';
const BASE_LULC_URL = `${GCS_BUCKET}/lulc_overlay_3857.tif`
const SCENARIO_LAYER_GROUP_NAME = 'Scenarios';

// JSTS utilities
const ol3parser = new OL3Parser();
ol3parser.inject(
  // Order of these matters even though we don't use them all
  Point,
  LineString,
  LinearRing,
  Polygon,
  MultiPoint,
  MultiLineString,
  MultiPolygon,
);
const wktWriter = new WKTWriter();

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

let selectedFeature = null;
const selectionLayer = new VectorTileLayer({
  renderMode: 'vector',
  source: parcelLayer.getSource(),
  style: (feature) => {
    // have to compare feature ids, not the feature objects, because tiling
    // will split some features in to multiple objects with the same id
    if (selectedFeature && feature.get('fid') === selectedFeature.get('fid')) {
      return selectedFeatureStyle;
    }
  },
});
selectionLayer.setZIndex(3);

let hoveredFeature = null;
const hoveredLayer = new VectorTileLayer({
  renderMode: 'vector',
  source: parcelLayer.getSource(),
  style: (feature) => {
    // have to compare feature ids, not the feature objects, because tiling
    // will split some features in to multiple objects with the same id
    if (hoveredFeature && feature.get('fid') === hoveredFeature.get('fid')) {
      return hoveredFeatureStyle;
    }
  },
});
hoveredLayer.setZIndex(3);

const studyAreaSource = new VectorSource({});
const studyAreaLayer = new VectorLayer({
  source: studyAreaSource,
  style: studyAreaStyle
});
studyAreaLayer.set('title', 'Study Area');
studyAreaLayer.setZIndex(3);

const scenarioLayerGroup = new LayerGroup({});
scenarioLayerGroup.set('type', 'scenario-group');
scenarioLayerGroup.set('title', SCENARIO_LAYER_GROUP_NAME);
scenarioLayerGroup.setZIndex(1);

// Urban Cooling & Urban Nature models each have a serviceshed
const serviceshedLayerUCM = new VectorLayer({
  style: (feature) => styleServiceshed(feature, COOLING_DISTANCE_STR),
});
serviceshedLayerUCM.setZIndex(3);
const serviceshedLayerUNA = new VectorLayer({
  style: (feature) => styleServiceshed(feature, NATURE_ACCESS_DISTANCE_STR),
});
serviceshedLayerUNA.setZIndex(3);

// Set a default basemap to be visible
satelliteLayer.setVisible(true);

const lulcLayer = lulcTileLayer(BASE_LULC_URL, 'Landcover', 'base');

const map = new Map({
  layers: [
    satelliteLayer,
    streetMapLayer,
    lulcLayer,
    parcelLayer,
    selectionLayer,
    hoveredLayer,
    studyAreaLayer,
    patternSamplerLayer,
    labelLayer,
    scenarioLayerGroup,
    serviceshedLayerUCM,
    serviceshedLayerUNA,
  ],
  view: new View({
    center: [-10964048.932711, 3429505.23069662], // San Antonio, TX EPSG:3857
    zoom: 12,
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
    studyAreaParcels,
    hoveredParcel,
    activeStudyAreaID,
    refreshStudyArea,
    patternSamplingMode,
    setPatternSampleWKT,
    scenarios,
    selectedScenario,
    servicesheds,
  } = props;
  const [layers, setLayers] = useState([]);
  const [showLayerControl, setShowLayerControl] = useState(false);
  const [selectedParcel, setSelectedParcel] = useState(null);
  const [hoveredCode, setHoveredCode] = useState(null);
  const [showLegendControl, setShowLegendControl] = useState(false);
  // refs for elements to insert openlayers-controlled nodes into the dom
  const mapElementRef = useRef();

  /** State updater for map layers.
   *
   * Map layers are managed by the map object rather than react state,
   * but some data is used by react components so we move those
   * attributes into react state here.
   * */
  const setMapLayers = () => {
    const lyrs = map.getAllLayers().map(lyr => (
      [lyr.get('type'), lyr.get('title'), lyr.getVisible()]
    ));
    // LayerGroups are excluded from getAllLayers, but
    // we want to include the Group in the LayerPanel
    // in addition to it's children, as toggling the Group
    // is a convenient way to show/hide all children.
    lyrs.push(
      [
        scenarioLayerGroup.get('type'),
        scenarioLayerGroup.get('title'),
        scenarioLayerGroup.getVisible(),
      ],
    );
    setLayers(lyrs);
  };

  /**
   * Click handler for layers controlled by checkboxes (not radios).
   * @param  {string}  title - title of layer to show/hide
   * @param  {Boolean} visible
   * @return {undefined}
   */
  const setVisibility = (title, visible) => {
    // Use getLayers instead of getAllLayers
    // so that this can work for Layers and LayerGroups.
    // But note this will not reach Layers w/in Groups.
    map.getLayers().forEach(lyr => {
      if (lyr.get('title') === title) {
        lyr.setVisible(visible);
        if (lyr.get('type') === 'scenario-group') {
          setShowLegendControl(visible);
        }
      }
    });
    setMapLayers();
  };

  const switchBasemap = (title) => {
    map.getAllLayers().forEach((layer) => {
      if (layer.get('type') === 'base') {
        layer.setVisible(layer.get('title') === title);
      }
    });
    setShowLegendControl(title === 'Landcover');
    setMapLayers();
  };

  const switchScenario = (title) => {
    map.getAllLayers().forEach((layer) => {
      if (layer.get('type') === 'scenario') {
        layer.setVisible(layer.get('title') === title);
      }
    });
    setMapLayers();
  };

  const setLulcStyle = (lulcType) => {
    map.getAllLayers().forEach((layer) => {
      if (layer.get('type') === 'scenario' || layer.get('title') === 'Landcover') {
        layer.setStyle(getStyle(lulcType));
      }
    });
  };

  const toggleLayerControl = () => {
    if (showLayerControl) {
      setShowLayerControl(false);
    } else {
      setShowLayerControl(true);
    }
  };

  const clearSelection = () => {
    // It feels kinda weird to have selectedFeature outside
    // React scope, but it works.
    selectedFeature = null;
    selectionLayer.changed();
    setSelectedParcel(null);
  };

  const zoomToStudyArea = () => {
    map.getView().fit(
      studyAreaSource.getExtent(),
      {
        padding: [10, 10, 10, 10], // pixels
        maxZoom: 16,
      },
    );
  };

  useEffect(() => {
    if (selectedScenario) { switchScenario(selectedScenario); }
  }, [selectedScenario]);

  useEffect(() => {
    if (hoveredParcel) {
      const feats = parcelLayer.getSource().getFeaturesInExtent(
        map.getView().calculateExtent()
      );
      feats.forEach((feature) => {
        if (feature.get('fid') === hoveredParcel) {
          hoveredFeature = feature;
        }
      });
    } else {
      hoveredFeature = null;
    }
    hoveredLayer.changed();
  }, [hoveredParcel]);

  // useEffect with no dependencies: only runs after first render
  useEffect(() => {
    window.onresize = () => setTimeout(map.updateSize(), 200); // update *after* resize
    map.setTarget(mapElementRef.current);
    setMapLayers();
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
      // NOTE that a feature's geometry can change with the tile/zoom level and
      // view position and so its coordinates will change slightly.
      parcelLayer.getFeatures(event.pixel).then(async (features) => {
        const geoms = [];
        const feature = features.length ? features[0] : undefined;
        if (feature) {
          // Find all the pieces of a feature in case they are split across tiles
          const fid = feature.get('fid');
          const extent = feature.getExtent();
          const feats = parcelLayer.getSource().getFeaturesInExtent(extent);
          feats.forEach((feat) => {
            if (feat.get('fid') === fid) {
              geoms.push(ol3parser.read((new Polygon(
                feat.getFlatCoordinates(),
                'XY',
                feat.getEnds()
              ))));
            }
          });
          const geom = geoms.reduce((partial, a) => OverlayOp.union(partial, a));
          const wkt = wktWriter.write(geom);
          selectedFeature = feature;
          selectionLayer.changed();
          setSelectedParcel({
            parcelID: fid,
            address: feature.get('address'),
            coords: wkt,
          });
        }
      });
    });

    map.on(['pointermove'], async (event) => {
      // Get the value at hover / pointer location location from lulc layer
      let baseData = null;
      let scenarioData = null;

      map.getAllLayers().forEach((layer) => {
        // Need to check base Landcover vs Scenario layers since scenario
        // layers will be in front of base Landcover
        if (layer.get('title') === 'Landcover' && layer.get('type') === 'base') {
          if (layer.getVisible()) {
            baseData = layer.getData(event.pixel);
          }
        } else if (layer.get('type') === 'scenario') {
          if (layer.getVisible()) {
            scenarioData = layer.getData(event.pixel);
          }
        }
      });
      if (scenarioData && scenarioData[1]) { // check band [1] for nodata
        // Get here if a Scenario LULC is visible
        setHoveredCode(scenarioData[0].toString());
      } else if (baseData && baseData[1]) {
        // Base LULC visible but no Scenario LULC visible
        setHoveredCode(baseData[0].toString());
      } else {
        // No scenario LULC or base LULC selected / visible
        setHoveredCode(null);
      }
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

    map.getLayers().on('add', () => {
      setMapLayers();
    });

    map.getLayers().on('remove', () => {
      setMapLayers();
    });

    map.updateSize();
  }, []);

  useEffect(() => {
    // A naive approach where we don't need to know if studyAreaParcels changed
    // because a study area was modified, or because the study area was switched.
    studyAreaSource.clear();
    if (studyAreaParcels.length) {
      const features = studyAreaParcels.map((parcel) => {
        const feature = wktFormat.readFeature(parcel.wkt, {
          dataProjection: 'EPSG:3857',
          featureProjection: 'EPSG:3857',
        });
        return feature;
      });
      studyAreaSource.addFeatures(features);
      zoomToStudyArea();
    }
  }, [studyAreaParcels]);

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
      const mostRecentLyr = scenarioLayers.pop();
      mostRecentLyr.setVisible(true);
      scenarioLayers.push(mostRecentLyr);
      scenarioLayerGroup.setLayers(new Collection(scenarioLayers));
      map.addLayer(scenarioLayerGroup);
      setShowLegendControl(true);
    }
    clearSelection();
  }, [scenarios]);

  useEffect(() => {
    map.removeLayer(serviceshedLayerUCM);
    map.removeLayer(serviceshedLayerUNA);
    const sources = {};
    if (Object.keys(servicesheds).length) {
      Object.entries(servicesheds).forEach(([model, path]) => {
        const source = new VectorSource({
          format: new GeoJSON({
            dataProjection: 'EPSG:3857',
          }),
          url: publicUrl(path),
        });
        sources[model] = source;
      });

      const serviceshedSource = sources['urban_nature_access'];
      serviceshedLayerUCM.setSource(sources['urban_cooling_model']);
      serviceshedLayerUNA.setSource(serviceshedSource);

      serviceshedSource.once('change', () => {
        if (serviceshedSource.getState() === 'ready'
          && serviceshedSource.getFeatures().length) {
          map.getView().fit(
            serviceshedSource.getExtent(),
            {
              padding: [10, 10, 10, 10], // pixels
              maxZoom: 16,
            },
          );
        }
      });
      map.getLayers().extend([serviceshedLayerUCM, serviceshedLayerUNA]);
      setVisibility('Labels', false);
    }
  }, [servicesheds]);

  // toggle pattern sampler visibility according to the pattern sampling mode
  useEffect(() => {
    if (patternSamplerLayer) {
      if (patternSamplingMode) {
        setVisibility(SCENARIO_LAYER_GROUP_NAME, false);
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
    <div
      className="map-container"
      onMouseOut={() => setHoveredCode(null)}
    >
      <div ref={mapElementRef} className="map-viewport" />
      <div className="layers-control">
        <Button
          onClick={toggleLayerControl}
          aria-label="open map layers panel"
        >
          <Icon icon="layers" />
        </Button>
        <LayerPanel
          show={showLayerControl}
          layers={layers}
          setVisibility={setVisibility}
          switchBasemap={switchBasemap}
          switchScenario={switchScenario}
          selectedScenario={selectedScenario}
        />
      </div>
      <ParcelControl
        sessionID={sessionID}
        activeStudyAreaID={activeStudyAreaID}
        parcel={selectedParcel}
        clearSelection={clearSelection}
        refreshStudyArea={refreshStudyArea}
        immutableStudyArea={Boolean(scenarios.length)}
      />
      <LegendControl
        show={showLegendControl}
        lulcCode={hoveredCode}
        setLulcStyle={setLulcStyle}
      />
    </div>
  );
}
