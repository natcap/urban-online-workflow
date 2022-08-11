import React, { useState } from 'react';

import {
  FocusStyleManager,
  Tab,
  Tabs,
} from '@blueprintjs/core';

import ScenarioTable from './scenarioTable';
import PortfolioTable from './portfolioTable';
import ParcelTable from './parcelTable';

FocusStyleManager.onlyShowFocusOnTabs();

export default function EditMenu(props) {
  const {
    selectedParcel,
    savedScenarios,
    refreshSavedScenarios,
    patternSamplingMode,
    togglePatternSamplingMode,
    patternSampleWKT,
    sessionID,
  } = props;

  const [activeTab, setActiveTab] = useState('create');
  const [parcelSet, setParcelSet] = useState({});

  const addParcel = async (parcel) => {
    setParcelSet((prev) => {
      const newSet = { ...prev, ...parcel };
      return newSet;
    });
  };

  const removeParcel = (parcel) => {
    setParcelSet((prev) => {
      const newSet = { ...prev };
      newSet.delete(parcel.parcelID);
      return newSet;
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
              <ScenarioTable
                sessionID={sessionID}
                parcelSet={parcelSet}
                removeParcel={removeParcel}
                patternSamplingMode={patternSamplingMode}
                togglePatternSamplingMode={togglePatternSamplingMode}
                refreshSavedScenarios={refreshSavedScenarios}
              />
              <ParcelTable
                sessionID={sessionID}
                parcel={selectedParcel}
                addParcel={addParcel}
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
