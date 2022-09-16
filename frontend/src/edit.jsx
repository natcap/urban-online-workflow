import React, { useState } from 'react';

import {
  FocusStyleManager,
  Tab,
  Tabs,
} from '@blueprintjs/core';

import ScenarioBuilder from './scenarioBuilder';
import ScenarioTable from './scenarioTable';

FocusStyleManager.onlyShowFocusOnTabs();

export default function EditMenu(props) {
  const {
    parcelSet,
    selectedParcel,
    removeParcel,
    savedStudyAreas,
    refreshSavedStudyAreas,
    patternSamplingMode,
    togglePatternSamplingMode,
    patternSampleWKT,
    sessionID,
  } = props;

  const [activeTab, setActiveTab] = useState('create');
  const [activeStudyAreaID, setActiveStudyAreaID] = useState(null);
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
              <ScenarioBuilder
                sessionID={sessionID}
                parcelSet={parcelSet}
                removeParcel={removeParcel}
                patternSamplingMode={patternSamplingMode}
                patternSampleWKT={patternSampleWKT}
                togglePatternSamplingMode={togglePatternSamplingMode}
                refreshSavedStudyAreas={refreshSavedStudyAreas}
                activeStudyAreaID={activeStudyAreaID}
                setActiveStudyAreaID={setActiveStudyAreaID}
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
