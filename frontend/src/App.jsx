import MapComponent from './map';
import EditMenu from './edit';
import React, { useState, useEffect } from 'react';

import { getAllScenarios } from './requests';

export default function App() {
  const [editMenuIsOpen, setEditMenuIsOpen] = useState(false);
  const [parcel, setParcel] = useState(null);
  const [savedScenarios, setSavedScenarios] = useState([]);

  const toggleEditMenu = () => {
    setEditMenuIsOpen((prev) => !prev);
  };

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
          toggleEditMenu={toggleEditMenu}
          setParcel={setParcel}
        />
        <EditMenu
          open={true}
          parcel={parcel}
          refreshSavedScenarios={refreshSavedScenarios}
          savedScenarios={savedScenarios}
        />
      </div>
    </div>
  );
}
