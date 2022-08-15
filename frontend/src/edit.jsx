import React, { useState } from 'react';

import {
  FocusStyleManager,
  Tab,
  Tabs,
} from '@blueprintjs/core';

import ScenarioTable from './scenarioTable';
import PortfolioTable from './portfolioTable';

FocusStyleManager.onlyShowFocusOnTabs();

export default function EditMenu(props) {
  const {
    parcelSet,
    selectedParcel,
    removeParcel,
    savedScenarios,
    refreshSavedScenarios,
    patternSamplingMode,
    togglePatternSamplingMode,
    patternSampleWKT,
    sessionID,
  } = props;

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
              <ScenarioTable
                sessionID={sessionID}
                parcelSet={parcelSet}
                removeParcel={removeParcel}
                patternSamplingMode={patternSamplingMode}
                patternSampleWKT={patternSampleWKT}
                togglePatternSamplingMode={togglePatternSamplingMode}
                refreshSavedScenarios={refreshSavedScenarios}
              />
            </div>
          )}
        />
        <Tab
          id="explore"
          title="Analyze"
          panel={<PortfolioTable savedScenarios={savedScenarios} />}
        />
      </Tabs>
    </div>
  );
}
