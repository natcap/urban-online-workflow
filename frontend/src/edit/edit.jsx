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
    // parcelSet,
    selectedParcel,
    removeParcel,
    refreshSavedStudyAreas,
    patternSamplingMode,
    togglePatternSamplingMode,
    patternSampleWKT,
    sessionID,
    // activeStudyAreaID,
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
                removeParcel={removeParcel}
                // immutableStudyArea={Boolean(activeStudyAreaID)}
                // activeStudyAreaID={activeStudyAreaID}
              />
              <ScenarioBuilder
                // createStudyArea={createStudyArea}
                sessionID={sessionID}
                parcelSet={studyArea.parcels}
                removeParcel={removeParcel}
                patternSamplingMode={patternSamplingMode}
                patternSampleWKT={patternSampleWKT}
                togglePatternSamplingMode={togglePatternSamplingMode}
                refreshSavedStudyAreas={refreshSavedStudyAreas}
                activeStudyAreaID={studyArea.id}
                // setActiveStudyAreaID={setActiveStudyAreaID}
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
