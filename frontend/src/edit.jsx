import React, { useState, useEffect } from 'react';

import {
  Button,
  FocusStyleManager,
  FormGroup,
  HTMLSelect,
  InputGroup,
  Icon,
  Radio,
  RadioGroup,
  Switch,
  Tab,
  Tabs,
} from '@blueprintjs/core';

import {
  doWallpaper,
  makeScenario,
  getLulcTableForParcel,
  getWallpaperResults,
  getStatus,
  getPatterns,
  createPattern,
  convertToSingleLULC,
} from './requests';
import useInterval from './hooks/useInterval';
import ScenarioTable from './scenarioTable';
import ParcelTable from './parcelTable';
import lulcCodes from './lulcCodes';

FocusStyleManager.onlyShowFocusOnTabs();

export default function EditMenu(props) {
  const {
    parcel,
    savedScenarios,
    refreshSavedScenarios,
    patternSamplingMode,
    // setPatternSamplingMode,
    togglePatternSamplingMode,
    patternSampleWKT,
  } = props;

  const [activeTab, setActiveTab] = useState('create');
  const [scenarioName, setScenarioName] = useState('');
  const [scenarioID, setScenarioID] = useState(null);
  const [selectedPattern, setSelectedPattern] = useState('');
  const [patterns, setPatterns] = useState([]);
  const [parcelTable, setParcelTable] = useState(null);
  const [jobID, setJobID] = useState(null);
  const [newPatternName, setNewPatternName] = useState("New Pattern 1");
  const [singleLULC, setSingleLULC] = useState('');
  const [conversionOption, setConversionOption] = useState('paint');

  // On first render, get the list of available patterns
  useEffect(async () => {
    setPatterns(await getPatterns());
  }, []);

  useEffect(async () => {
    if (parcel) {
      const table = await getLulcTableForParcel(parcel.coords);
      setParcelTable(table);
    }
  }, [parcel]);

  useInterval(async () => {
    console.log('checking status for', jobID);
    const status = await getStatus(jobID);
    if (status === 'complete') {
      const results = await getWallpaperResults(jobID);
      setParcelTable(results);
      setJobID(null);
    }
  }, jobID ? 1000 : null);

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
    if (!Object.values(savedScenarios).includes(scenarioName)) {
      currentScenarioID = await makeScenario(scenarioName, 'description');
      setScenarioID(currentScenarioID);
    }
    let jid;
    if (selectedPattern) {
      jid = await doWallpaper(parcel.coords, selectedPattern, currentScenarioID);
    }
    if (singleLULC) {
      jid = await convertToSingleLULC(parcel.coords, singleLULC, currentScenarioID);
    }
    setJobID(jid);
    refreshSavedScenarios();
  }

  // TODO: do handlers  need to be wrapped in useCallback? 
  // to memoize the function?
  const handleRadio = (event) => {
    setSelectedPattern(event.target.value);
  };

  const handleSelectLULC = (event) => {
    setSingleLULC(event.target.value);
  };

  const handleConversionOption = (event) => {
    const { value } = event.target;
    setConversionOption(event.target.value);
    // if (value === 'wallpaper') {
    //   setPatternSamplingMode(true);
    // } else {
    //   setPatternSamplingMode(false);
    // }
  };

  const handleTabChange = (tabID) => {
    setActiveTab(tabID);
  };

  const handleSamplePattern = async (event) => {
    event.preventDefault();
    await createPattern(patternSampleWKT, newPatternName);
    setPatterns(await getPatterns());
    togglePatternSamplingMode();
  };

  const patternSampleForm = (
    <>
      <p>Drag the box over the area to sample.</p>
      <FormGroup label="Name" labelFor="text-input">
        <InputGroup
          id="text-input"
          placeholder="Placeholder text"
          value={newPatternName}
          onChange={(event) => setNewPatternName(event.target.value)} />
      </FormGroup>
      <Button
        icon="camera"
        text="Sample this pattern"
        onClick={handleSamplePattern} />
    </>
  );

  return (
    <div className="menu-container">
      <Tabs id="Tabs" onChange={handleTabChange} selectedTabId={activeTab}>
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
                        inline={true}
                        label="Modify the landuse of this parcel by:"
                        onChange={handleConversionOption}
                        selectedValue={conversionOption}
                      >
                        <Radio key="wallpaper" value="wallpaper" label="wallpaper" />
                        <Radio key="paint" value="paint" label="paint" />
                      </RadioGroup>
                      {
                        (conversionOption === 'paint')
                          ? (
                            <HTMLSelect
                              onChange={handleSelectLULC}
                            >
                              {Object.entries(lulcCodes).map(([k, v]) => <option value={k}>{v}</option>)}
                            </HTMLSelect>
                          )
                          : (
                            <>
                              <div className="edit-wallpaper">
                                <HTMLSelect
                                  onChange={setSelectedPattern}
                                  disabled={patternSamplingMode}
                                >
                                  <option selected>Choose a pattern...</option>
                                  {patterns.map((pattern) => <option value={pattern}>{pattern}</option>)}
                                </HTMLSelect>
                                <Switch
                                  checked={patternSamplingMode}
                                  labelElement={<strong>Create new pattern</strong>}
                                  onChange={togglePatternSamplingMode}
                                />
                              </div>
                              {patternSamplingMode ? patternSampleForm : <React.Fragment/>}
                            </>
                          )
                      }
                      <h4>Add this modification to a scenario</h4>
                      <datalist id="scenariolist">
                        {Object.values(savedScenarios).map(item => <option key={item} value={item} />)}
                      </datalist>
                      <input
                        type="search"
                        id="scenarioName"
                        list="scenariolist"
                        value={scenarioName}
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
          title="Explore"
          panel={<ScenarioTable scenarioLookup={savedScenarios} />}
        />
      </Tabs>
    </div>
  );
}
