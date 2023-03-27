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
  // const [parcelSet, setParcelSet] = useState([]);
  // const [activeStudyAreaID, setActiveStudyAreaID] = useState(null);

  const refreshSavedStudyAreas = async () => {
    // studyAreas object returned from backend includes set of parcels
    // in that study area.
    const studyAreas = await getStudyAreas(sessionID);
    console.log(studyAreas);
    setSavedStudyAreas(studyAreas);
  };

  const createStudyArea = async () => {
    // const id = await postStudyArea(sessionID);
    const area = await postStudyArea(sessionID);
    // const id = await postStudyArea(sessionID, name, parcelSet);
    console.log(area);
    // setActiveStudyAreaID(id);
    setStudyArea(area);
    // refreshSavedStudyAreas();
  };

  const switchStudyArea = async (id) => {
    const area = await getStudyArea(sessionID, id);
    setStudyArea(area);
    // const activeArea = savedStudyAreas.filter(
    //   (area) => area.id === Number(id)
    // )[0];
    // setActiveStudyAreaID(id);
    // if (activeArea) {
    //   setParcelSet(activeArea.parcels);
    // } else {
    //   setParcelSet([]);
    // }
  };

  const refreshStudyArea = async () => {
    console.log(sessionID)
    console.log(studyArea.id)
    const area = await getStudyArea(sessionID, studyArea.id);
    console.log(area)
    setStudyArea(area);
    // setParcelSet(activeArea.parcels);
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
              parcelSet={studyArea.parcels}
              activeStudyAreaID={studyArea.id}
              refreshStudyArea={refreshStudyArea}
            />
            <EditMenu
              sessionID={sessionID}
              studyArea={studyArea}
              // parcelSet={studyArea.parcels}
              // removeParcel={removeParcel}
              nameStudyArea={nameStudyArea}
              refreshSavedStudyAreas={refreshSavedStudyAreas}
              // activeStudyAreaID={studyArea.id}
              switchStudyArea={switchStudyArea}
              savedStudyAreas={savedStudyAreas}
            />
          </div>
        </div>
      )
      : <div />
  );
}
