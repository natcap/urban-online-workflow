import React, { useState, useEffect } from 'react';

import {
  FocusStyleManager,
  Section,
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
import Explore from './explore';
import { getInvestResults } from '../requests';

import nlcdLookup from '../../../appdata/nlcd_colormap.json';
import nludLookup from '../../../appdata/nlud_colormap.json';
import treeLookup from '../../../appdata/tree_colormap.json';

const LULC_LOOKUP = {
  nlcd: nlcdLookup,
  nlud: nludLookup,
  tree: treeLookup,
};

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
    setSelectedScenario,
    setServicesheds,
    setActiveTab,
    activeTab,
    startBuilding,
  } = props;

  // const [activeTab, setActiveTab] = useState('explore');
  const [results, setResults] = useState({});
  const [scenarioDescriptions, setScenarioDescriptions] = useState(null);

  const setInvestResults = async () => {
    // Do results exist for these scenarios? We check after the investRunner
    // determines that all jobs completed. We also check anytime the
    // list of scenarios are updated, such as when the study area changes
    // or new scenario is added.
    const modelResults = await Promise.all(
      scenarios.map(scenario => getInvestResults(scenario.scenario_id))
    );
    const data = {};
    let servicesheds = {};
    scenarios.forEach((scenario, idx) => {
      if (Object.values(modelResults[idx])[0] !== 'InVEST result not found') {
        data[scenario.name] = modelResults[idx]['results'];
        servicesheds = { ...servicesheds, ...modelResults[idx]['servicesheds'] };
      }
    });
    setServicesheds(servicesheds);
    setResults(data);
  };

  useEffect(() => {
    if (scenarios.length) {
      // It's nice to have a brief text description of the landcover change
      // for each scenario. Figure out which classes comprise > 50%
      // of the area changed and just list those.
      const descriptions = {};
      scenarios.forEach((scenario) => {
        const stats = JSON.parse(scenario.lulc_stats);
        descriptions[scenario.name] = {
          nlcd: [],
          nlud: [],
          tree: [],
        };
        ['nlcd', 'nlud', 'tree'].forEach((lulcType) => {
          const sorted = Object.entries(stats[lulcType])
            .sort(([, a], [, b]) => b - a);
          const sortedClasses = sorted.map((x) => x[0]);
          const sortedValues = sorted.map((x) => x[1]);
          const total = sortedValues.reduce((partial, a) => partial + a, 0);
          let x = 0;
          let i = 0;
          while (x < total / 2) {
            x += sortedValues[i];
            i++;
          }
          const topClasses = sortedClasses.slice(0, i);
          descriptions[scenario.name][lulcType] = topClasses.map(
            (code) => LULC_LOOKUP[lulcType][code].name
          );
        });
      });
      (async () => {
        await setInvestResults();
        setScenarioDescriptions(descriptions);
      })();
    }
  }, [scenarios]);

  return (
    <div className="menu-container">
      <Tabs
        id="Tabs"
        onChange={(tabID) => setActiveTab(tabID)}
        selectedTabId={activeTab}
      >
        <Tab
          id="explore"
          title="explore"
          panel={(
            <Explore
              startBuilding={startBuilding}
            />
          )}
        />
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
                    <Section
                      title="Get Started"
                    >
                      <ol>
                        <li>Click on the map to select a parcel</li>
                        <li>Add any number of parcels to a study area</li>
                      </ol>
                    </Section>
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
                        completeResults={
                          scenarios.every((scene) => (
                            results[scene.name]
                            && Object.keys(results[scene.name]).length
                          ))
                        }
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
          (
            results.baseline
            && Object.keys(results.baseline).length
            && scenarioDescriptions
          )
            ? (
              <Tab
                id="results"
                title="results"
                panel={(
                  <Results
                    results={results}
                    scenarioDescriptions={scenarioDescriptions}
                    setSelectedScenario={setSelectedScenario}
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
