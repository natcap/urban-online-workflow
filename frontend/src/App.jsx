import MapComponent from './map';
import EditMenu from './edit';
import React, { useState, useEffect } from 'react';

import { getAllScenarios } from './requests';

export default function App() {
  const [parcel, setParcel] = useState(null);
  const [savedScenarios, setSavedScenarios] = useState([]);

  const refreshSavedScenarios = async () => {
    const scenarios = await getAllScenarios();
    setSavedScenarios(scenarios);
  };

  useEffect(async () => {
    refreshSavedScenarios();
  }, []);

  return (
    <div className="App">
      <div className="map-and-menu-container">
        <MapComponent
          setParcel={setParcel}
        />
        <EditMenu
          parcel={parcel}
          refreshSavedScenarios={refreshSavedScenarios}
          savedScenarios={savedScenarios}
        />
      </div>
    </div>
  );
}
