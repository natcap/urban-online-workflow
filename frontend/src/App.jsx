import React, { useState, useEffect } from 'react';
import MapComponent from './map';
import EditMenu from './edit';

import { getStudyAreas, createSession } from './requests';

export default function App() {
  const [savedStudyAreas, setSavedStudyAreas] = useState([]);
  const [patternSamplingMode, setPatternSamplingMode] = useState(false);
  const [patternSampleWKT, setPatternSampleWKT] = useState(null);
  const [sessionID, setSessionID] = useState(null);
  const [parcelSet, setParcelSet] = useState({});
  const [activeStudyAreaID, setActiveStudyAreaID] = useState(null);
  const [scenarioLulcRasters, setScenarioLulcRasters] = useState(null);

  const refreshSavedStudyAreas = async () => {
    const studyAreas = await getStudyAreas(sessionID);
    // setSavedStudyAreas(studyAreas); // TODO: not using this just yet
    const aoi = studyAreas.filter((area) => area.id === activeStudyAreaID)[0];
    const rasters = {};
    if (aoi && aoi.scenarios) {
      const rasterPaths = aoi.scenarios.forEach((scene) => {
        rasters[scene.name] = scene.lulc_url_result
      });
      setScenarioLulcRasters(rasters);
    }
    
  };

  useEffect(async () => {
    setSessionID(await createSession());
  }, []);

  useEffect(() => {
    if (sessionID) {
      refreshSavedStudyAreas();
    }
  }, [sessionID]);

  const addParcel = async (parcel) => {
    setParcelSet((prev) => {
      const newSet = { ...prev, ...parcel };
      return newSet;
    });
  };

  const removeParcel = (parcelID) => {
    setParcelSet((prev) => {
      const newSet = { ...prev };
      delete newSet[parcelID];
      return newSet;
    });
  };

  const togglePatternSamplingMode = () => {
    setPatternSamplingMode((mode) => !mode);
  };

  return (
    (sessionID)
      ? (
        <div className="App">
          <div className="map-and-menu-container">
            <MapComponent
              addParcel={addParcel}
              patternSamplingMode={patternSamplingMode}
              setPatternSampleWKT={setPatternSampleWKT}
              sessionID={sessionID}
              scenarioLulcRasters={{water: '/opt/appdata/scenarios/1/1_parcel_fill.tif'}}
            />
            <EditMenu
              parcelSet={parcelSet}
              removeParcel={removeParcel}
              refreshSavedStudyAreas={refreshSavedStudyAreas}
              patternSamplingMode={patternSamplingMode}
              togglePatternSamplingMode={togglePatternSamplingMode}
              patternSampleWKT={patternSampleWKT}
              sessionID={sessionID}
              setScenarioLulcRasters={setScenarioLulcRasters}
              activeStudyAreaID={activeStudyAreaID}
              setActiveStudyAreaID={setActiveStudyAreaID}
            />
          </div>
        </div>
      )
      : <div />
  );
}
