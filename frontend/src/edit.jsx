import React, { useState, useEffect } from 'react';

import {
  HTMLTable,
  Radio,
  RadioGroup,
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
    open,
    parcelCoords,
    parcelID,
    savedScenarios,
    refreshSavedScenarios,
  } = props;

  const [scenarioName, setScenarioName] = useState('');
  const [scenarioID, setScenarioID] = useState(null);
  const [pattern, setPattern] = useState('');
  const [parcelTable, setParcelTable] = useState(null);
  const [jobID, setJobID] = useState(null);

  useEffect(async () => {
    if (parcelID) {
      const table = await getLulcTableForParcel(parcelCoords);
      setParcelTable(table);
    }
  }, [parcelID]);

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
    if (!parcelID) {
      alert('no parcel was selected; no changes to make');
      return;
    }
    let sid = scenarioID;
    if (!Object.values(savedScenarios).includes(scenarioName)) {
      sid = await makeScenario(scenarioName, 'description');
      setScenarioID(sid);
    }
    const jid = await doWallpaper(parcelCoords, pattern, sid);
    setJobID(jid);
    refreshSavedScenarios();
  }

  // TODO: does this need to be wrapped in useCallback? 
  // to memoize this function?
  const handleRadio = (event) => {
    setPattern(event.target.value);
  };

  const wallpaperTable = (
    <RadioGroup
      inline={false}
      // inline
      label="Modify the landuse of this parcel by selecting a pattern:"
      onChange={handleRadio}
      selectedValue={pattern}
    >
      <br />
      <Radio
        value="orchard"
        label="orchard"
      />
      <br />
      <Radio
        value="city park"
        label="city park"
      />
      <br />
      <Radio
        value="housing"
        label="housing"
      />
    </RadioGroup>
  );

  if (open) {
    return (
      <div className="menu-container">
        {/*<div>
          <h4 className="scenario-select">Viewing scenario: </h4>
          <HTMLSelect
            className="scenario-select"
            value={selectedScenario}
            options={Object.keys(savedScenarios)}
            onChange={(event) => selectScenario(event.currentTarget.value)}
          />
        </div>*/}
        <div>
          {(Object.keys(savedScenarios).length > 1)
            ? <ScenarioTable scenarioLookup={savedScenarios} />
            : <div />
          }
        </div>
        {(parcelTable)
          ? <ParcelTable parcelTable={parcelTable} />
          : <h4>Select a parcel to modify</h4>}
        <form onSubmit={handleSubmitNew}>
          <br />
          {wallpaperTable}
          <br />
          <h4>Add this modification to existing scenario, or create a new scenario</h4>
          <datalist id="scenariolist">
            {Object.values(savedScenarios).forEach(item => <option key={item} value={item} />)}
          </datalist>
          <input
            type="search"
            id="scenarioName"
            list="scenariolist"
            value={scenarioName}
            onChange={(event) => setScenarioName(event.currentTarget.value)}
          />
          <br />
          <button type="submit">Submit</button>
        </form>
      </div>
    );
  } else {
    return <div />
  }
}
