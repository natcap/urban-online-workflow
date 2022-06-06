import MapComponent from './map';
import EditMenu from './edit';
import React, { useState } from 'react';

import Scenario from './scenario';

const DEFAULT_SCENARIOS = [
  new Scenario('baseline'),
  new Scenario('pecan'),
];

export default function App() {
  const [editMenuIsOpen, setEditMenuIsOpen] = useState(false);
  const [selectedParcel, setSelectedParcel] = useState(null);
  const [scenario, setScenario] = useState(null);
  // TODO: Eventually I expect this data to be stored on disk
  // in a persistent storage rather than here in memory.
  const [savedScenarios, setSavedScenarios] = useState(DEFAULT_SCENARIOS);

  const toggleEditMenu = () => {
    setEditMenuIsOpen((prev) => !prev);
  };

  const save = (scene) => {
    // TODO: overwrite existing scene on save instead of unshift
    // https://stackoverflow.com/questions/597588/how-do-you-clone-an-array-of-objects-in-javascript
    const scenarios = savedScenarios.map((item) => ({ ...item }));
    scenarios.unshift(scene);
    setSavedScenarios(scenarios);
    console.log(savedScenarios);
  };

  // console.log(selectedParcel);
  return (
    <div className="App">
      <div className="map-and-menu-container">
        <MapComponent
          toggleEditMenu={toggleEditMenu}
          setSelectedParcel={setSelectedParcel}
        />
        <EditMenu
          open={true}
          selectedParcel={selectedParcel}
          // scenario={scenario}
          saveScenario={save}
          savedScenarios={savedScenarios}
        />
      </div>
    </div>
  );
}
