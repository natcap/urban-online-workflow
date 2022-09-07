import React, { useState } from 'react';

import {
  FocusStyleManager,
  Tab,
  Tabs,
} from '@blueprintjs/core';

import ScenarioBuilder from './scenarioBuilder';
import StudyAreaTable from './studyAreaTable';

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
  console.log(savedStudyAreas)

  const [activeTab, setActiveTab] = useState('create');

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
              />
            </div>
          )}
        />
        {/*<Tab
          id="explore"
          title="Analyze"
          panel={<StudyAreaTable savedScenarios={savedScenarios} />}
        />*/}
      </Tabs>
    </div>
  );
}
