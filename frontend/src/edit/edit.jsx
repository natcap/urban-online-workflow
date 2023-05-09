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
import InvestRunner from './investRunner';
import Results from './results';
import { getInvestResults } from '../requests';

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
    setHoveredParcel,
    switchStudyArea,
    savedStudyAreas,
  } = props;

  const [activeTab, setActiveTab] = useState('scenarios');
  const [results, setResults] = useState({});

  const setInvestResults = async () => {
    console.log(scenarios)
    const modelResults = await Promise.all(
      scenarios.map(scenario => getInvestResults(scenario.scenario_id))
    );
    // Are there results yet?
    if (modelResults.every((res) => Object.keys(res).length > 0)) {
      const data = {};
      scenarios.forEach((scenario, idx) => {
        data[scenario.name] = modelResults[idx];
      });
      console.log(data);
      setResults(data);
    }
  };

  useEffect(() => {
    setInvestResults();
  }, [scenarios]);

  return (
    <div className="menu-container">
      <Tabs
        id="Tabs"
        onChange={(tabID) => setActiveTab(tabID)}
        selectedTabId={activeTab}
      >
        <Tab
          id="scenarios"
          title="scenarios"
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
                      setHoveredParcel={setHoveredParcel}
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
                        setInvestResults={setInvestResults}
                        setActiveTab={setActiveTab}
                      />
                    </>
                  )
                  : <div />
              }
            </div>
          )}
        />
        {
          (Object.keys(results).length)
            ? (
              <Tab
                id="results"
                title="results"
                panel={(
                  <Results
                    results={results}
                    studyAreaName={studyArea.name}
                  />
                )}
              />
            )
            : <div />
        }
      </Tabs>
    </div>
  );
}
