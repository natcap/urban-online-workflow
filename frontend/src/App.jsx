import React, { useState, useEffect } from 'react';
import MapComponent from './map';
import EditMenu from './edit';

import { getStudyAreas, createSession } from './requests';

export default function App() {
  const [savedStudyAreas, setSavedStudyAreas] = useState([]);
  const [patternSamplingMode, setPatternSamplingMode] = useState(false);
  const [patternSampleWKT, setPatternSampleWKT] = useState(null);
  const [sessionID, setSessionID] = useState(null);
  const [parcelSet, setParcelSet] = useState({});

  const refreshSavedStudyAreas = async () => {
    setSavedStudyAreas(await getStudyAreas(sessionID));
  };

  useEffect(async () => {
    setSessionID(await createSession());
  }, []);

  useEffect(() => {
    if (sessionID) {
      refreshSavedStudyAreas();
    }
  }, [sessionID]);

  const addParcel = async (parcel) => {
    setParcelSet((prev) => {
      const newSet = { ...prev, ...parcel };
      return newSet;
    });
  };

  const removeParcel = (parcelID) => {
    setParcelSet((prev) => {
      const newSet = { ...prev };
      delete newSet[parcelID];
      return newSet;
    });
  };

  const togglePatternSamplingMode = () => {
    setPatternSamplingMode((mode) => !mode);
  };

  return (
    (sessionID)
      ? (
        <div className="App">
          <div className="map-and-menu-container">
            <MapComponent
              addParcel={addParcel}
              patternSamplingMode={patternSamplingMode}
              setPatternSampleWKT={setPatternSampleWKT}
              sessionID={sessionID}
            />
            <EditMenu
              parcelSet={parcelSet}
              removeParcel={removeParcel}
              refreshSavedStudyAreas={refreshSavedStudyAreas}
              savedStudyAreas={savedStudyAreas}
              patternSamplingMode={patternSamplingMode}
              togglePatternSamplingMode={togglePatternSamplingMode}
              patternSampleWKT={patternSampleWKT}
              sessionID={sessionID}
            />
          </div>
        </div>
      )
      : <div />
  );
}
