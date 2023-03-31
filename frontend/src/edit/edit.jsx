import React, { useState, useEffect } from 'react';

import {
  FocusStyleManager,
  Tab,
  Tabs,
} from '@blueprintjs/core';

import ScenarioBuilder from './scenarioBuilder';
import ScenarioTable from './scenarioTable';
import SelectStudyArea from './selectStudyArea';
import StudyAreaTable from './studyAreaTable';
import InputStudyAreaName from './inputStudyAreaName';
import landuseCodes from '../landuseCodes';
import { getScenarios } from '../requests';

FocusStyleManager.onlyShowFocusOnTabs();

export default function EditMenu(props) {
  const {
    nameStudyArea,
    refreshStudyArea,
    patternSamplingMode,
    togglePatternSamplingMode,
    patternSampleWKT,
    sessionID,
    studyArea,
    switchStudyArea,
    savedStudyAreas,
  } = props;

  const [activeTab, setActiveTab] = useState('create');
  const [scenarioIDs, setScenarioIDs] = useState([]);
  // const [scenarioTable, setScenarioTable] = useState(null);

  // const addScenarioLULCTable = (table) => {
  //   setScenarioTable((prev) => {
  //     const newTable = { ...prev, ...table };
  //     return newTable;
  //   });
  // };


  const refreshScenarios = async () => {
    if (studyArea.id) {
      const scenarios = await getScenarios(studyArea.id);
      setScenarioIDs(scenarios);
    }
  };

  useEffect(async () => {
    refreshScenarios();
  }, [studyArea.id]);

  return (
    <div className="menu-container">
      <Tabs
        id="Tabs"
        onChange={(tabID) => setActiveTab(tabID)}
        selectedTabId={activeTab}
      >
        <Tab
          id="create"
          title="Create"
          panel={(
            <div>
              {
                (studyArea.id)
                  ? (
                    <>
                      <SelectStudyArea
                        studyAreaID={studyArea.id}
                        switchStudyArea={switchStudyArea}
                        savedStudyAreas={savedStudyAreas}
                      />
                      <InputStudyAreaName
                        nameStudyArea={nameStudyArea}
                        name={studyArea.name}
                      />
                    </>
                  )
                  : <div />
              }
              {
                (studyArea.parcels.length)
                  ? (
                    <StudyAreaTable
                      parcelArray={studyArea.parcels}
                      studyAreaID={studyArea.id}
                      refreshStudyArea={refreshStudyArea}
                    />
                  )
                  : (
                    <p className="sidebar-subheading">
                      <span>Click on the map to add parcels</span>
                    </p>
                  )
              }
              <ScenarioBuilder
                sessionID={sessionID}
                parcelArray={studyArea.parcels}
                patternSamplingMode={patternSamplingMode}
                patternSampleWKT={patternSampleWKT}
                togglePatternSamplingMode={togglePatternSamplingMode}
                activeStudyAreaID={studyArea.id}
                // addScenarioLULCTable={addScenarioLULCTable}
                refreshScenarios={refreshScenarios}
              />
            </div>
          )}
        />
        {
          (scenarioIDs.length)
            ? (
              <Tab
                id="explore"
                title="Analyze"
                panel={
                  <ScenarioTable
                    scenarioIDs={scenarioIDs}
                  />
                }
              />
            )
            : <div />
        }
      </Tabs>
    </div>
  );
}
