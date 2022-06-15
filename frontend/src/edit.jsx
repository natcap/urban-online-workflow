import React, { useState, useEffect } from 'react';

import {
  Radio,
  RadioGroup,
  Tab,
  Tabs,
} from '@blueprintjs/core';

import {
  doWallpaper,
  makeScenario,
  getLulcTableForParcel,
  getWallpaperResults,
  getStatus,
} from './requests';
import useInterval from './hooks/useInterval';
import ScenarioTable from './scenarioTable';
import ParcelTable from './parcelTable';

export default function EditMenu(props) {
  const {
    parcel,
    savedScenarios,
    refreshSavedScenarios,
  } = props;

  const [activeTab, setActiveTab] = useState('create');
  const [scenarioName, setScenarioName] = useState('');
  const [scenarioID, setScenarioID] = useState(null);
  const [pattern, setPattern] = useState('');
  const [parcelTable, setParcelTable] = useState(null);
  const [jobID, setJobID] = useState(null);

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
    if (!pattern) {
      alert('no modification options selected; no changes to make');
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
    const jid = await doWallpaper(parcel.coords, pattern, currentScenarioID);
    setJobID(jid);
    refreshSavedScenarios();
  }

  // TODO: do handlers  need to be wrapped in useCallback? 
  // to memoize the function?
  const handleRadio = (event) => {
    setPattern(event.target.value);
  };

  const handleTabChange = (tabID) => {
    setActiveTab(tabID);
  };

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
              <form onSubmit={handleSubmitNew}>
                <RadioGroup
                  inline={false}
                  label="Modify the landuse of this parcel by selecting a pattern:"
                  onChange={handleRadio}
                  selectedValue={pattern}
                >
                  <Radio
                    value="orchard"
                    label="orchard"
                  />
                  <Radio
                    value="city park"
                    label="city park"
                  />
                  <Radio
                    value="housing"
                    label="housing"
                  />
                </RadioGroup>
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
