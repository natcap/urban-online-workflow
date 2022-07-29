import React, { useState, useEffect } from 'react';
import MapComponent from './map';
import EditMenu from './edit';

import { getAllScenarios, createSession } from './requests';

export default function App() {
  const [parcel, setParcel] = useState(null);
  const [savedScenarios, setSavedScenarios] = useState([]);
  const [patternSamplingMode, setPatternSamplingMode] = useState(false);
  const [patternSampleWKT, setPatternSampleWKT] = useState(null);
  const [sessionID, setSessionID] = useState(null);

  const refreshSavedScenarios = async () => {
    const scenarios = await getAllScenarios(sessionID);
    setSavedScenarios(scenarios);
  };

  useEffect(async () => {
    const sID = await createSession();
    setSessionID(sID.session_id);
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
