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
import InvestRunner from './investRunner';

FocusStyleManager.onlyShowFocusOnTabs();

export default function EditMenu(props) {
  const {
    nameStudyArea,
    refreshStudyArea,
    refreshScenarios,
    scenarios,
    patternSamplingMode,
    togglePatternSamplingMode,
    patternSampleWKT,
    sessionID,
    studyArea,
    switchStudyArea,
    savedStudyAreas,
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
          title=""
          panel={(
            <div>
              {
                (studyArea.id)
                  ? (
                    <div id="study-area-input-container">
                      <SelectStudyArea
                        studyAreaID={studyArea.id}
                        switchStudyArea={switchStudyArea}
                        savedStudyAreas={savedStudyAreas}
                      />
                      <InputStudyAreaName
                        nameStudyArea={nameStudyArea}
                        name={studyArea.name}
                      />
                    </div>
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
                      immutableStudyArea={Boolean(scenarios.length)}
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
                refreshScenarios={refreshScenarios}
                scenarioNames={scenarios.map((scene) => scene.name)}
              />
              {
                (scenarios.length)
                  ? (
                    <>
                      <ScenarioTable
                        scenarios={scenarios}
                      />
                      <br />
                      <InvestRunner
                        scenarios={scenarios}
                        refreshScenarios={refreshScenarios}
                      />
                    </>
                  )
                  : <div />
              }
            </div>
          )}
        />
      </Tabs>
    </div>
  );
}
