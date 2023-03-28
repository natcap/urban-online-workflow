import React, { useState, useEffect } from 'react';
import MapComponent from './map/map';
import EditMenu from './edit/edit';

import {
  getStudyArea,
  getStudyAreas,
  createSession,
  getSession,
  postStudyArea,
  updateStudyArea,
} from './requests';

export default function App() {
  const [sessionID, setSessionID] = useState(null);
  const [savedStudyAreas, setSavedStudyAreas] = useState([]);
  const [studyArea, setStudyArea] = useState({
    id: null,
    parcels: [],
  });

  const refreshSavedStudyAreas = async () => {
    const studyAreas = await getStudyAreas(sessionID);
    console.log(studyAreas);
    setSavedStudyAreas(studyAreas);
  };

  const createStudyArea = async () => {
    const area = await postStudyArea(sessionID);
    console.log(area);
    setStudyArea(area);
  };

  const switchStudyArea = async (id) => {
    const area = await getStudyArea(sessionID, id);
    setStudyArea(area);
  };

  const refreshStudyArea = async () => {
    console.log(sessionID)
    console.log(studyArea.id)
    const area = await getStudyArea(sessionID, studyArea.id);
    console.log(area)
    setStudyArea(area);
  };

  const nameStudyArea = async (name) => {
    const area = JSON.parse(JSON.stringify(studyArea));
    area.name = name;
    const updatedArea = await updateStudyArea(sessionID, area);
    setStudyArea(updatedArea);
  };

  useEffect(async () => {
    let SID = localStorage.getItem('sessionID');
    if (SID) {
      const session = await getSession(SID);
      console.log(session)
      if (session && session.id) {
        setSessionID(SID);
        return;
      }
    }
    SID = await createSession();
    setSessionID(SID);
    localStorage.setItem('sessionID', SID);
  }, []);

  useEffect(() => {
    if (sessionID) {
      refreshSavedStudyAreas();
      createStudyArea();
    }
  }, [sessionID]);

  return (
    (sessionID)
      ? (
        <div className="App">
          <div className="map-and-menu-container">
            <MapComponent
              sessionID={sessionID}
              parcelSet={studyArea.parcels}
              activeStudyAreaID={studyArea.id}
              refreshStudyArea={refreshStudyArea}
            />
            <EditMenu
              sessionID={sessionID}
              studyArea={studyArea}
              refreshStudyArea={refreshStudyArea}
              nameStudyArea={nameStudyArea}
              refreshSavedStudyAreas={refreshSavedStudyAreas}
              switchStudyArea={switchStudyArea}
              savedStudyAreas={savedStudyAreas}
            />
          </div>
        </div>
      )
      : <div />
  );
}
