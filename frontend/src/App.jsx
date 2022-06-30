import MapComponent from './map';
import EditMenu from './edit';
import React, { useState, useEffect } from 'react';

import { getAllScenarios } from './requests';

export default function App() {
  const [parcel, setParcel] = useState(null);
  const [savedScenarios, setSavedScenarios] = useState([]);
  const [patternSelectMode, setPatternSelectMode] = useState(false);
  const [patternSelectionBox, setPatternSelectionBox] = useState(null);

  const refreshSavedScenarios = async () => {
    const scenarios = await getAllScenarios();
    setSavedScenarios(scenarios);
  };

  useEffect(async () => {
    refreshSavedScenarios();
  }, []);

  const togglePatternSelectMode = () => {
    console.log('toggle pattern select mode');
    setPatternSelectMode(patternSelectMode => !patternSelectMode);
  }

  const getPatternGeom = () => {

  }

  console.log('rendering app');
  console.log('pattern box', patternSelectionBox);

  return (
    <div className="App">
      <div className="map-and-menu-container">
        <MapComponent
          setParcel={setParcel}
          patternSelectMode={patternSelectMode}
          setPatternSelectionBox={setPatternSelectionBox}
        />
        <EditMenu
          parcel={parcel}
          refreshSavedScenarios={refreshSavedScenarios}
          savedScenarios={savedScenarios}
          patternSelectMode={patternSelectMode}
          togglePatternSelectMode={togglePatternSelectMode}
          patternSelectionBox={patternSelectionBox}
        />
      </div>
    </div>
  );
}
