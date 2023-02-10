import React, { useState, useEffect } from 'react';
import MapComponent from './map/map_new';
import EditMenu from './edit/edit';

import { getStudyAreas, createSession } from './requests';

export default function App() {
  const [sessionID, setSessionID] = useState(null);
  const [activeStudyAreaID, setActiveStudyAreaID] = useState(null);
  const [savedStudyAreas, setSavedStudyAreas] = useState([]);
  // const [patternSamplingMode, setPatternSamplingMode] = useState(false);
  // const [patternSampleWKT, setPatternSampleWKT] = useState(null);
  const [parcelSet, setParcelSet] = useState({});
  // const [scenarioLulcRasters, setScenarioLulcRasters] = useState(null);

  const refreshSavedStudyAreas = async () => {
    const studyAreas = await getStudyAreas(sessionID);
    // setSavedStudyAreas(studyAreas); // TODO: not using this just yet
    const aoi = studyAreas.filter((area) => area.id === activeStudyAreaID)[0];
    const rasters = {};
    if (aoi && aoi.scenarios) {
      const rasterPaths = aoi.scenarios.forEach((scene) => {
        rasters[scene.name] = scene.lulc_url_result;
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

  // const togglePatternSamplingMode = () => {
  //   setPatternSamplingMode((mode) => !mode);
  // };

  console.log(scenarioLulcRasters)
  return (
    (sessionID)
      ? (
        <div className="App">
          <div className="map-and-menu-container">
            <MapComponent
              sessionID={sessionID}
              addParcel={addParcel}
              // patternSamplingMode={patternSamplingMode}
              // setPatternSampleWKT={setPatternSampleWKT}
              // scenarioLulcRasters={scenarioLulcRasters}
            />
            <EditMenu
              sessionID={sessionID}
              // parcelSet={parcelSet}
              removeParcel={removeParcel}
              refreshSavedStudyAreas={refreshSavedStudyAreas}
              // patternSamplingMode={patternSamplingMode}
              // togglePatternSamplingMode={togglePatternSamplingMode}
              // patternSampleWKT={patternSampleWKT}
              // setScenarioLulcRasters={setScenarioLulcRasters}
              activeStudyAreaID={activeStudyAreaID}
              // setActiveStudyAreaID={setActiveStudyAreaID}
            />
          </div>
        </div>
      )
      : <div />
  );
}
