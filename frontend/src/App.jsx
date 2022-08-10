import React, { useState, useEffect } from 'react';
import MapComponent from './map';
import EditMenu from './edit';

import { getScenarios, createSession } from './requests';

export default function App() {
  const [selectedParcel, setSelectedParcel] = useState(null);
  const [parcelSet, setParcelSet] = useState({});
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

  const addParcel = (parcel) => {
    const addition = {
      [parcel.parcelID]: {
        coords: parcel.coords,
        table: parcel.table,
      },
    };
    setParcelSet((prev) => {
      const newSet = { ...prev, ...addition };
      return newSet;
    });
  };

  const removeParcel = (parcel) => {
    setParcelSet((prev) => {
      const newSet = { ...prev };
      newSet.delete(parcel.parcelID);
      return newSet;
    });
  };

  return (
    <div className="App">
      <div className="map-and-menu-container">
        <MapComponent
          setSelectedParcel={setSelectedParcel}
          patternSamplingMode={patternSamplingMode}
          setPatternSampleWKT={setPatternSampleWKT}
        />
        <EditMenu
          selectedParcel={selectedParcel}
          parcelSet={parcelSet}
          addParcel={addParcel}
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
