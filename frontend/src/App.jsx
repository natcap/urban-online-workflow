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
    id: undefined,
    parcels: [],
  });

  const switchStudyArea = async (id) => {
    let area;
    if (id !== 'new') {
      area = await getStudyArea(sessionID, id);
    } else {
      area = await postStudyArea(sessionID, 'Untitled');
      setSavedStudyAreas([...savedStudyAreas, area]);
    }
    setStudyArea(area);
  };

  const refreshStudyArea = async () => {
    const area = await getStudyArea(sessionID, studyArea.id);
    setStudyArea(area);
  };

  const nameStudyArea = async (name) => {
    const area = JSON.parse(JSON.stringify(studyArea));
    area.name = name;
    const updatedArea = await updateStudyArea(sessionID, area);
    setStudyArea(updatedArea);
    const otherAreas = savedStudyAreas.filter((area) => (
      area.id !== updatedArea.id
    ));
    setSavedStudyAreas(otherAreas.concat(updatedArea));
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

  useEffect(async () => {
    if (sessionID) {
      const studyAreas = await getStudyAreas(sessionID);
      console.log(studyAreas);
      if (studyAreas.length) {
        const areas = studyAreas.filter((area) => (
          area.parcels.length > 0
        ));
        setSavedStudyAreas(areas);
        await switchStudyArea(areas[0].id); // TODO: switch to most recently created
      } else {
        await switchStudyArea(undefined); // undefined id creates new study area
      }
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
              switchStudyArea={switchStudyArea}
              savedStudyAreas={savedStudyAreas}
            />
          </div>
        </div>
      )
      : <div />
  );
}
