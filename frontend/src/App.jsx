import React, { useState, useEffect } from 'react';
import MapComponent from './map/map_new';
import EditMenu from './edit/edit';

import {
  getStudyAreas,
  createSession,
  postStudyArea,
} from './requests';

export default function App() {
  const [sessionID, setSessionID] = useState(null);
  const [savedStudyAreas, setSavedStudyAreas] = useState([]);
  const [parcelSet, setParcelSet] = useState({});
  const [activeStudyAreaID, setActiveStudyAreaID] = useState(null);

  const refreshSavedStudyAreas = async () => {
    // studyAreas object returned from backend includes set of parcels
    // in that study area.
    const studyAreas = await getStudyAreas(sessionID);
    console.log(studyAreas);
    setSavedStudyAreas(studyAreas);
  };

  const createStudyArea = async (name) => {
    const id = await postStudyArea(sessionID, name, parcelSet);
    setActiveStudyAreaID(id);
    // refreshSavedStudyAreas();
  };

  const switchStudyArea = (id) => {
    const activeArea = savedStudyAreas.filter(
      (area) => area.id === id
    );
    console.log(activeArea);
    setActiveStudyAreaID(id);
    setParcelSet(activeArea.parcels);
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

  return (
    (sessionID)
      ? (
        <div className="App">
          <div className="map-and-menu-container">
            <MapComponent
              sessionID={sessionID}
              parcelSet={parcelSet}
              addParcel={addParcel}
            />
            <EditMenu
              sessionID={sessionID}
              parcelSet={parcelSet}
              removeParcel={removeParcel}
              createStudyArea={createStudyArea}
              refreshSavedStudyAreas={refreshSavedStudyAreas}
              activeStudyAreaID={activeStudyAreaID}
              // setActiveStudyAreaID={setActiveStudyAreaID}
              // savedStudyAreas={savedStudyAreas}
            />
          </div>
        </div>
      )
      : <div />
  );
}
