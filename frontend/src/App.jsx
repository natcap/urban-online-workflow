import MapComponent from './map';
import EditMenu from './edit';
import React, { useState, useEffect } from 'react';

import { getAllScenarios } from './requests';

export default function App() {
  const [editMenuIsOpen, setEditMenuIsOpen] = useState(false);
  const [parcelCoords, setParcelCoords] = useState(null);
  const [parcelID, setParcelID] = useState(null);
  const [savedScenarios, setSavedScenarios] = useState(null);

  const toggleEditMenu = () => {
    setEditMenuIsOpen((prev) => !prev);
  };

  useEffect(async () => {
    const scenarios = await getAllScenarios(); // [ { 'baseline': id }, { } ]
    console.log('scenarios', scenarios);
    setSavedScenarios(scenarios);
  }, []);

  const refreshSavedScenarios = async () => {
    const scenarios = await getAllScenarios();
    setSavedScenarios(scenarios);
    console.log(scenarios)
  };

  return (
    <div className="App">
      <div className="map-and-menu-container">
        <MapComponent
          toggleEditMenu={toggleEditMenu}
          setParcelCoords={setParcelCoords}
          setParcelID={setParcelID}
        />
        {(savedScenarios) // at minimum will be 'baseline' scenario
          ? (
            <EditMenu
              open={true}
              parcelCoords={parcelCoords}
              parcelID={parcelID}
              refreshSavedScenarios={refreshSavedScenarios}
              savedScenarios={savedScenarios}
            />
          )
          : <div />}
      </div>
    </div>
  );
}
