import React, { useState, useEffect } from 'react';

import {
  FocusStyleManager,
  HTMLSelect,
  Radio,
  RadioGroup,
  Tab,
  Tabs,
} from '@blueprintjs/core';

import {
  doWallpaper,
  makeScenario,
  getLulcTableForParcel,
  getJobResults,
  getJobStatus,
  getPatterns,
  createPattern,
  convertToSingleLULC,
} from './requests';
import useInterval from './hooks/useInterval';
import ScenarioTable from './scenarioTable';
import ParcelTable from './parcelTable';
import landuseCodes from './landuseCodes';
import WallpaperingMenu from './wallpaperingMenu';

FocusStyleManager.onlyShowFocusOnTabs();

export default function EditMenu(props) {
  const {
    parcel,
    savedScenarios,
    refreshSavedScenarios,
    patternSamplingMode,
    togglePatternSamplingMode,
    patternSampleWKT,
    sessionID,
  } = props;
  console.log(savedScenarios);

  const [activeTab, setActiveTab] = useState('create');
  const [scenarioName, setScenarioName] = useState('');
  const [scenarioID, setScenarioID] = useState(null);
  const [selectedPattern, setSelectedPattern] = useState(null);
  const [patterns, setPatterns] = useState([]);
  const [parcelTable, setParcelTable] = useState(null);
  const [jobID, setJobID] = useState(null);
  const [newPatternName, setNewPatternName] = useState('New Pattern 1');
  const [singleLULC, setSingleLULC] = useState('');
  const [conversionOption, setConversionOption] = useState('paint');

  // On first render, get the list of available patterns
  useEffect(async () => {
    setPatterns(await getPatterns() || []);
  }, []);

  useEffect(async () => {
    if (parcel) {
      const table = await getLulcTableForParcel(parcel.coords);
      setParcelTable(table);
    }
  }, [parcel]);

  useInterval(async () => {
    console.log('checking status for job', jobID);
    const status = await getJobStatus(jobID);
    if (status === 'success') {
      const results = await getJobResults(jobID, scenarioID);
      console.log(results);
      setParcelTable(results);
      setJobID(null);
    }
  }, (jobID && scenarioID) ? 1000 : null);

  async function handleSubmitNew(event) {
    event.preventDefault();
    if (!scenarioName) {
      alert('no scenario was selected');
      return;
    }
    if (!parcel) {
      alert('no parcel was selected; no changes to make');
      return;
    }
    let currentScenarioID = scenarioID;
    if (savedScenarios.every((scen) => scen.name !== scenarioName)) {
      currentScenarioID = await makeScenario(sessionID, scenarioName, 'description');
      setScenarioID(currentScenarioID);
    }
    let jid;
    if (conversionOption === 'wallpaper' && selectedPattern) {
      jid = await doWallpaper(parcel.coords, selectedPattern.label, currentScenarioID);
    }
    if (conversionOption === 'paint' && singleLULC) {
      jid = await convertToSingleLULC(parcel.coords, singleLULC, currentScenarioID);
    }
    setJobID(jid);
    refreshSavedScenarios();
  }

  const handleSamplePattern = async (event) => {
    event.preventDefault();
    await createPattern(patternSampleWKT, newPatternName, sessionID);
    setPatterns(await getPatterns());
    setSelectedPattern(
      patterns.filter((pattern) => pattern.label === newPatternName)
    );
    togglePatternSamplingMode();
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
              <ParcelTable parcelTable={parcelTable} />
              <br />
              {
                (parcel)
                  ? (
                    <form onSubmit={handleSubmitNew}>
                      <RadioGroup
                        className="sidebar-subheading"
                        inline
                        label="Modify the landuse of this parcel by:"
                        onChange={(event) => setConversionOption(event.target.value)}
                        selectedValue={conversionOption}
                      >
                        <Radio key="wallpaper" value="wallpaper" label="wallpaper" />
                        <Radio key="paint" value="paint" label="paint" />
                      </RadioGroup>
                      <div className="conversion-panel">
                        {
                          (conversionOption === 'paint')
                            ? (
                              <HTMLSelect
                                onChange={(event) => setSingleLULC(event.target.value)}
                              >
                                {Object.entries(landuseCodes)
                                  .map(([code, data]) => <option key={code} value={code}>{data.name}</option>)}
                              </HTMLSelect>
                            )
                            : (
                              <WallpaperingMenu
                                newPatternName={newPatternName}
                                setNewPatternName={setNewPatternName}
                                selectedPattern={selectedPattern}
                                setSelectedPattern={setSelectedPattern}
                                patternSamplingMode={patternSamplingMode}
                                togglePatternSamplingMode={togglePatternSamplingMode}
                                handleSamplePattern={handleSamplePattern}
                                patterns={patterns}
                              />
                            )
                        }
                      </div>
                      <p className="sidebar-subheading">
                        Add this modification to a scenario
                      </p>
                      <datalist id="scenariolist">
                        {Object.values(savedScenarios).map(
                          (scenario) => (
                            <option
                              key={scenario.scenario_id}
                              value={scenario.name} />
                            ),
                          )
                        }
                      </datalist>
                      <input
                        type="search"
                        id="scenarioName"
                        list="scenariolist"
                        value={scenarioName}
                        autoComplete="off"
                        onChange={(event) => setScenarioName(event.currentTarget.value)}
                      />
                      <button type="submit">Submit</button>
                    </form>
                  )
                  : <div />
              }
            </div>
          )}
        />
        <Tab
          id="explore"
          title="Analyze"
          panel={<ScenarioTable savedScenarios={savedScenarios} />}
        />
      </Tabs>
    </div>
  );
}
