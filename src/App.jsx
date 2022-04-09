import MapComponent from './map';
import EditMenu from './edit';
import React, { useState } from 'react';

export default function App () {

  const [editMenuIsOpen, setEditMenuIsOpen] = useState(false);

  const toggleEditMenu = () => {
    setEditMenuIsOpen((prev) => !prev);
  }

  console.log('render', editMenuIsOpen);
  return (
    <div className="App">
      <div className="map-and-menu-container">
        <MapComponent toggleEditMenu={toggleEditMenu} />
        <EditMenu open={editMenuIsOpen} />
      </div>
    </div>
  )
}
