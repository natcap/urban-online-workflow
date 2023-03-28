import React, { useState } from 'react';

import {
  FocusStyleManager,
  Tab,
  Tabs,
} from '@blueprintjs/core';

import ScenarioBuilder from './scenarioBuilder';
import ScenarioTable from './scenarioTable';
import SelectStudyArea from './selectStudyArea';
import StudyAreaForm from './studyAreaForm';
import landuseCodes from '../landuseCodes';


FocusStyleManager.onlyShowFocusOnTabs();

export default function EditMenu(props) {
  const {
    nameStudyArea,
    selectedParcel,
    refreshStudyArea,
    refreshSavedStudyAreas,
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
                switchStudyArea={switchStudyArea}
                savedStudyAreas={savedStudyAreas}
              />
              <StudyAreaForm
                nameStudyArea={nameStudyArea}
                parcelSet={studyArea.parcels}
                refreshStudyArea={refreshStudyArea}
              />
              <ScenarioBuilder
                sessionID={sessionID}
                parcelSet={studyArea.parcels}
                patternSamplingMode={patternSamplingMode}
                patternSampleWKT={patternSampleWKT}
                togglePatternSamplingMode={togglePatternSamplingMode}
                refreshSavedStudyAreas={refreshSavedStudyAreas}
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
