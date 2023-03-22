import React, { useState, useEffect } from 'react';
import MapComponent from './map/map';
import EditMenu from './edit/edit';

import {
  getStudyArea,
  getStudyAreas,
  createSession,
  getSession,
  postStudyArea,
} from './requests';

export default function App() {
  const [sessionID, setSessionID] = useState(null);
  const [savedStudyAreas, setSavedStudyAreas] = useState([]);
  const [parcelSet, setParcelSet] = useState([]);
  const [activeStudyAreaID, setActiveStudyAreaID] = useState(null);

  const refreshSavedStudyAreas = async () => {
    // studyAreas object returned from backend includes set of parcels
    // in that study area.
    const studyAreas = await getStudyAreas(sessionID);
    console.log(studyAreas);
    setSavedStudyAreas(studyAreas);
  };

  const createStudyArea = async () => {
    const id = await postStudyArea(sessionID);
    // const id = await postStudyArea(sessionID, name, parcelSet);
    console.log(id)
    setActiveStudyAreaID(id);
    // refreshSavedStudyAreas();
  };

  const switchStudyArea = (id) => {
    const activeArea = savedStudyAreas.filter(
      (area) => area.id === Number(id)
    )[0];
    setActiveStudyAreaID(id);
    if (activeArea) {
      setParcelSet(activeArea.parcels);
    } else {
      setParcelSet([]);
    }
  };

  const updateStudyArea = async () => {
    console.log(sessionID)
    console.log(activeStudyAreaID)
    const activeArea = await getStudyArea(sessionID, activeStudyAreaID);
    console.log(activeArea)
    setParcelSet(activeArea.parcels);
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

  // const addParcel = async (parcelCoords) => {
    // console.log(parcel)
    // setParcelSet((prev) => {
    //   const match = prev.filter((p) => p.id === parcel.id);
    //   console.log(match)
    //   if (match.length === 0) { return prev; }
    //   const newSet = prev.concat(parcel);
    //   return newSet;
      // const newSet = { ...prev, ...parcel };
      // return newSet;
    // });
  // };

  // const removeParcel = (parcelID) => {
  //   setParcelSet((prev) => {
  //     const match = prev.filter((p) => p.id !== parcelID);
  //     return match;
  //     // const newSet = { ...prev };
  //     // delete newSet[parcelID];
  //     // return newSet;
  //   });
  // };

  return (
    (sessionID)
      ? (
        <div className="App">
          <div className="map-and-menu-container">
            <MapComponent
              sessionID={sessionID}
              parcelSet={parcelSet}
              activeStudyAreaID={activeStudyAreaID}
              updateStudyArea={updateStudyArea}
            />
            <EditMenu
              sessionID={sessionID}
              parcelSet={parcelSet}
              // removeParcel={removeParcel}
              createStudyArea={createStudyArea}
              refreshSavedStudyAreas={refreshSavedStudyAreas}
              activeStudyAreaID={activeStudyAreaID}
              switchStudyArea={switchStudyArea}
              savedStudyAreas={savedStudyAreas}
            />
          </div>
        </div>
      )
      : <div />
  );
}
