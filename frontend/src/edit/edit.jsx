import React, { useState } from 'react';

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
  const [scenarioTable, setScenarioTable] = useState(null);

  const addScenarioLULCTable = (table) => {
    setScenarioTable((prev) => {
      const newTable = { ...prev, ...table };
      return newTable;
    });
  };

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
              <SelectStudyArea
                studyAreaID={studyArea.id}
                switchStudyArea={switchStudyArea}
                savedStudyAreas={savedStudyAreas}
              />
              <InputStudyAreaName
                nameStudyArea={nameStudyArea}
                name={studyArea.name}
              />
              {
                (studyArea.parcels.length)
                  ? (
                    <StudyAreaTable
                      parcelSet={studyArea.parcels}
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
                parcelSet={studyArea.parcels}
                patternSamplingMode={patternSamplingMode}
                patternSampleWKT={patternSampleWKT}
                togglePatternSamplingMode={togglePatternSamplingMode}
                // refreshSavedStudyAreas={refreshSavedStudyAreas}
                activeStudyAreaID={studyArea.id}
                addScenarioLULCTable={addScenarioLULCTable}
              />
            </div>
          )}
        />
        {
          (scenarioTable)
            ? (
              <Tab
                id="explore"
                title="Analyze"
                panel={<ScenarioTable scenarioTable={scenarioTable} />}
              />
            )
            : <div />
        }
      </Tabs>
    </div>
  );
}
