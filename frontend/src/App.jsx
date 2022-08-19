import React, { useState, useEffect } from 'react';
import MapComponent from './map';
import EditMenu from './edit';

import { getScenarios, createSession } from './requests';

export default function App() {
  const [savedScenarios, setSavedScenarios] = useState([]);
  const [patternSamplingMode, setPatternSamplingMode] = useState(false);
  const [patternSampleWKT, setPatternSampleWKT] = useState(null);
  const [sessionID, setSessionID] = useState(null);
  const [parcelSet, setParcelSet] = useState({});

  const refreshSavedScenarios = async () => {
    setSavedScenarios(await getScenarios(sessionID));
  };

  useEffect(async () => {
    setSessionID(await createSession());
    refreshSavedScenarios();
  }, []);

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
    <div className="App">
      <div className="map-and-menu-container">
        <MapComponent
          addParcel={addParcel}
          patternSamplingMode={patternSamplingMode}
          setPatternSampleWKT={setPatternSampleWKT}
          sessionID={sessionID}
        />
        <EditMenu
          parcelSet={parcelSet}
          removeParcel={removeParcel}
          refreshSavedScenarios={refreshSavedScenarios}
          savedScenarios={savedScenarios}
          patternSamplingMode={patternSamplingMode}
          togglePatternSamplingMode={togglePatternSamplingMode}
          patternSampleWKT={patternSampleWKT}
          sessionID={sessionID}
        />
      </div>
    </div>
  );
}
