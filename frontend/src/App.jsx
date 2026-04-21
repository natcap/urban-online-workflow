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
  const [hoveredParcel, setHoveredParcel] = useState(null);
  const [scenarios, setScenarios] = useState([]);
  const [patternSamplingMode, setPatternSamplingMode] = useState(false);
  const [patternSampleWKT, setPatternSampleWKT] = useState(null);
  const [selectedScenario, setSelectedScenario] = useState(null);
  const [selectedEquityLayer, setSelectedEquityLayer] = useState(null);
  const [servicesheds, setServicesheds] = useState({});
  const [activeTab, setActiveTab] = useState('explore');
  const [start, setStart] = useState(0);
  const [firstVisit, setFirstVisit] = useState(true);

  const switchStudyArea = async (id) => {
    let area;
    if (id && id !== 'new') {
      area = await getStudyArea(sessionID, id);
    } else {
      area = await createStudyArea(sessionID, 'Untitled');
      setSavedStudyAreas([...savedStudyAreas, area]);
    }
    // Clear scenarios from the previous study area to avoid child
    // components rendering with them before receiving updated props
    setScenarios([]);
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

  const startBuilding = () => {
    // If the session already contains a study area
    // it means the user already knows how to use the app
    // and we should skip the starting map scene.
    if (!studyArea.parcels.length) {
      setStart((start) => start + 1);
    }
    setActiveTab('scenarios');
    // First visitors should have no other choice but to
    // click Get Started, after which we can remove
    // the "firstVisit" guardrails.
    setFirstVisit(false);
  };

  useEffect(() => {
    (async () => {
      let SID = localStorage.getItem('sessionID');
      if (SID) {
        setFirstVisit(false);
        const session = await getSession(SID);
        if (session && session.id) {
          setSessionID(SID);
          return;
        }
      }
      SID = await createSession();
      setSessionID(SID);
      localStorage.setItem('sessionID', SID);
    })();
  }, []);

  useEffect(() => {
    (async () => {
      if (sessionID) {
        const studyAreas = await getStudyAreas(sessionID);
        const areas = studyAreas.filter((area) => (
          area.parcels.length > 0
        ));
        if (areas.length) {
          setActiveTab('scenarios');
          setSavedStudyAreas(areas);
          await switchStudyArea(areas[0].id); // TODO: switch to most recently created
        } else {
          await switchStudyArea(undefined); // undefined id creates new study area
        }
      }
    })();
  }, [sessionID]);

  useEffect(() => {
    refreshScenarios();
    setServicesheds({});
  }, [studyArea.id]);

  return (
    (sessionID)
      ? (
        <div className="App">
          <div className="map-and-menu-container">
            <MapComponent
              sessionID={sessionID}
              studyAreaParcels={studyArea.parcels}
              hoveredParcel={hoveredParcel}
              activeStudyAreaID={studyArea.id}
              refreshStudyArea={refreshStudyArea}
              patternSamplingMode={patternSamplingMode}
              setPatternSampleWKT={setPatternSampleWKT}
              scenarios={scenarios}
              selectedScenario={selectedScenario}
              setSelectedEquityLayer={setSelectedEquityLayer}
              selectedEquityLayer={selectedEquityLayer}
              servicesheds={servicesheds}
              activeTab={activeTab}
              start={start}
            />
            <EditMenu
              firstVisit={firstVisit}
              key={studyArea.id}
              sessionID={sessionID}
              studyArea={studyArea}
              setHoveredParcel={setHoveredParcel}
              refreshStudyArea={refreshStudyArea}
              nameStudyArea={nameStudyArea}
              switchStudyArea={switchStudyArea}
              savedStudyAreas={savedStudyAreas}
              refreshScenarios={refreshScenarios}
              scenarios={scenarios}
              patternSamplingMode={patternSamplingMode}
              togglePatternSamplingMode={togglePatternSamplingMode}
              patternSampleWKT={patternSampleWKT}
              setSelectedScenario={setSelectedScenario}
              setServicesheds={setServicesheds}
              selectedEquityLayer={selectedEquityLayer}
              setActiveTab={setActiveTab}
              activeTab={activeTab}
              startBuilding={startBuilding}
            />
          </div>
        </div>
      )
      : <div />
  );
}
