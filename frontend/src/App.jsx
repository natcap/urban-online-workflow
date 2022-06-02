import MapComponent from './map';
import EditMenu from './edit';
import React, { useState } from 'react';

function saveScenario(scene) {
  console.log(scene);
}

export default function App() {
  const [editMenuIsOpen, setEditMenuIsOpen] = useState(false);
  const [selectedParcel, setSelectedParcel] = useState(null);
  const [scenario, setScenario] = useState(null);

  const toggleEditMenu = () => {
    setEditMenuIsOpen((prev) => !prev);
  };

  console.log(selectedParcel);
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
          scenario={scenario}
          saveScenario={saveScenario}
        />
      </div>
    </div>
  )
}
