import { Map, View } from 'ol';
import { Fill, Stroke, Style } from 'ol/style';
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
  const { setParcel, patternSamplingMode, setPatternSampleWKT } = props;
  // refs for elements to insert openlayers-controlled nodes into the dom
  const mapElementRef = useRef();

  const [map, setMap] = useState(undefined);

  // useEffect with no dependencies: only runs after first render
  useEffect(() => {
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
    let selectedFeature;
    const selectionLayer = new VectorTileLayer({
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

    // define the map
    const map = new Map({
      target: mapElementRef.current,
      layers: [
        streetMapLayer,
        parcelLayer,
        selectionLayer,
      ],
      view: new View({
        center: [-10964368.72, 3429876.58], // San Antonio, EPSG:3857
        zoom: 19,
      }),
    });

    setMap(map);

    const patternSamplerBoxWidth = 100; // box dimensions in map CRS units
    const [mapCenterX, mapCenterY] = map.getView().getCenter();
    const patternSamplerFeature = new Feature(
      new Polygon([
        [
          [mapCenterX - patternSamplerBoxWidth / 2, mapCenterY - patternSamplerBoxWidth / 2],
          [mapCenterX - patternSamplerBoxWidth / 2, mapCenterY + patternSamplerBoxWidth / 2],
          [mapCenterX + patternSamplerBoxWidth / 2, mapCenterY + patternSamplerBoxWidth / 2],
          [mapCenterX + patternSamplerBoxWidth / 2, mapCenterY - patternSamplerBoxWidth / 2],
          [mapCenterX - patternSamplerBoxWidth / 2, mapCenterY - patternSamplerBoxWidth / 2],
        ],
      ]),
    );
    const patternSamplerLayer = new VectorLayer({
      source: new VectorSource({
        features: [
          patternSamplerFeature,
        ],
      }),
      style: new Style({
        stroke: new Stroke({
          width: 3,
        }),
        fill: new Fill({
          color: [255, 255, 255, 0.4],
        }),
      }),
      visible: false,
    });

    const translate = new Translate({
      layers: [patternSamplerLayer],
    });

    const wkt = new WKT();
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
    map.addLayer(patternSamplerLayer);
    map.addInteraction(translate);

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
  }, []);

  useEffect(() => {
    if (map) {
      const patternSamplerLayer = map.getLayers().getArray()[3];
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
