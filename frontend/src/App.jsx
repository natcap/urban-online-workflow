import React, { useState, useEffect } from 'react';
import MapComponent from './map';
import EditMenu from './edit';

import { getScenarios, createSession } from './requests';

export default function App() {
  const [parcel, setParcel] = useState(null);
  const [savedScenarios, setSavedScenarios] = useState([]);
  const [patternSamplingMode, setPatternSamplingMode] = useState(false);
  const [patternSampleWKT, setPatternSampleWKT] = useState(null);
  const [sessionID, setSessionID] = useState(null);

  const refreshSavedScenarios = async () => {
    setSavedScenarios(await getScenarios(sessionID));
  };

  useEffect(async () => {
    setSessionID(await createSession());
    refreshSavedScenarios();
  }, []);

  const togglePatternSamplingMode = () => {
    setPatternSamplingMode((mode) => !mode);
  };

  return (
    <div className="App">
      <div className="map-and-menu-container">
        <MapComponent
          setParcel={setParcel}
          patternSamplingMode={patternSamplingMode}
          setPatternSampleWKT={setPatternSampleWKT}
        />
        <EditMenu
          parcel={parcel}
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
