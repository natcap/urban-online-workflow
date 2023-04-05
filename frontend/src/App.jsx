import React, { useState, useEffect } from 'react';
import MapComponent from './map/map';
import EditMenu from './edit/edit';

import {
  getStudyArea,
  getStudyAreas,
  createSession,
  getSession,
  createStudyArea,
  updateStudyArea,
  getScenarios,
} from './requests';

export default function App() {
  const [sessionID, setSessionID] = useState(null);
  const [savedStudyAreas, setSavedStudyAreas] = useState([]);
  const [studyArea, setStudyArea] = useState({
    id: undefined,
    parcels: [],
  });
  const [scenarios, setScenarios] = useState([]);
  const [patternSamplingMode, setPatternSamplingMode] = useState(false);
  const [patternSampleWKT, setPatternSampleWKT] = useState(null);

  const switchStudyArea = async (id) => {
    let area;
    if (id && id !== 'new') {
      area = await getStudyArea(sessionID, id);
    } else {
      area = await createStudyArea(sessionID, 'Untitled');
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

  const refreshScenarios = async () => {
    if (studyArea.id) {
      const scenes = await getScenarios(studyArea.id);
      setScenarios(scenes);
    }
  };

  const togglePatternSamplingMode = () => {
    setPatternSamplingMode((mode) => !mode);
  };

  useEffect(async () => {
    let SID = localStorage.getItem('sessionID');
    if (SID) {
      const session = await getSession(SID);
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
      const areas = studyAreas.filter((area) => (
        area.parcels.length > 0
      ));
      if (areas.length) {
        setSavedStudyAreas(areas);
        await switchStudyArea(areas[0].id); // TODO: switch to most recently created
        // refreshScenarios();
      } else {
        await switchStudyArea(undefined); // undefined id creates new study area
      }
    }
  }, [sessionID]);

  useEffect(() => {
    refreshScenarios();
  }, [studyArea.id]);

  return (
    (sessionID)
      ? (
        <div className="App">
          <div className="map-and-menu-container">
            <MapComponent
              sessionID={sessionID}
              studyAreaParcels={studyArea.parcels}
              activeStudyAreaID={studyArea.id}
              refreshStudyArea={refreshStudyArea}
              patternSamplingMode={patternSamplingMode}
              setPatternSampleWKT={setPatternSampleWKT}
              scenarios={scenarios}
            />
            <EditMenu
              sessionID={sessionID}
              studyArea={studyArea}
              refreshStudyArea={refreshStudyArea}
              nameStudyArea={nameStudyArea}
              switchStudyArea={switchStudyArea}
              savedStudyAreas={savedStudyAreas}
              refreshScenarios={refreshScenarios}
              scenarios={scenarios}
              patternSamplingMode={patternSamplingMode}
              togglePatternSamplingMode={togglePatternSamplingMode}
              patternSampleWKT={patternSampleWKT}
            />
          </div>
        </div>
      )
      : <div />
  );
}
