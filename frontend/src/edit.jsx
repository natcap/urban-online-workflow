import React, { useState, useEffect } from 'react';

import {
  Button,
  HTMLSelect,
  HTMLTable,
  Radio,
  RadioGroup,
} from '@blueprintjs/core';

import { wallpaper, getLULCTableForParcel } from './requests';
import Scenario from './scenario';

function makeInfoTable(parcelTable) {
  // parcelTable is [ {baseline: {}}, {pecan: {}}, ... ]
  const rows = [];
  rows.push(
    <tr>
      <td> </td>
      <td>forest</td>
      <td>housing</td>
      <td>grass</td>
      <td>orchard</td>
    </tr>
  );
  parcelTable.forEach((scen) => {
    const name = Object.keys(scen)[0];
    const values = Object.values(scen[name]);
    rows.push(
      <tr>
        <td>{name}</td>
        {values.map((val) => <td>{val}</td>)}
      </tr>
    );
  });
  return (
    <HTMLTable bordered striped>
      <tbody>
        {rows}
      </tbody>
    </HTMLTable>
  );
}

export default function EditMenu(props) {
  const {
    open,
    selectedParcel, // coords
    scenario, // handed down from App so this is 'baseline'
    saveScenario,
    savedScenarios,
  } = props;

  // const [baseScene, setBaseScene] = useState('');
  // const [baseTable, setBaseTable] = useState(null);
  // const [newScene, setNewScene] = useState(null);
  // const [newTable, setNewTable] = useState(null);
  const [scenarioName, setScenarioName] = useState('');
  const [pattern, setPattern] = useState('');
  const [selectedScenario, selectScenario] = useState('baseline');
  const [parcelTable, setParcelTable] = useState([]);

  // useEffect(() => {
  //   setBaseScene(scenario);
  // }, [scenario]);
  useEffect(async () => {
    if (selectedParcel) {
      const tables = await Promise.all(savedScenarios.map((scen) => {
        return getLULCTableForParcel(selectedParcel, scen);
      }));
      setParcelTable(tables);
      // setBaseTable(await getLULCTableForParcel(selectedParcel, baseScene));
    }
  }, [selectedParcel, savedScenarios]);
  // useEffect(async () => {
  //   if (newScene) {
  //     setNewTable(await getLULCTableForParcel(selectedParcel, newScene));
  //   }
  // }, [selectedParcel, newScene]);

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
    console.log(`creating ${scenarioName}`);
    console.log(`wallpapering with ${pattern}`);
    const scene = new Scenario(scenarioName);
    // TODO: request do wallpapering
    // await wallpaper(selectedParcel, pattern, scene)
    saveScenario(scene);
    // setNewScene(scene);
    selectScenario(scenarioName);
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

    // <img src="/wallpaper_sample.png" />
    // <img src="/wallpaper_sample.png" />
    // <img src="/wallpaper_sample.png" />

  if (open) {
    console.log(savedScenarios)
    return (
      <div className="menu-container">
        <div>
          <h4 className="scenario-select">Viewing scenario: </h4>
          <HTMLSelect
            className="scenario-select"
            value={selectedScenario}
            options={savedScenarios.map(item => item.name)}
            onChange={(event) => selectScenario(event.currentTarget.value)}
          />
        </div>
        <h4>Select a parcel to modify</h4>
        {(selectedParcel)
          ? makeInfoTable(parcelTable)
          : <div />}
        {/*<h4>{`In new scenario: '${scenarioName}'`}</h4>
        {newTable ? makeInfoTable(newTable) : <div />}*/}
        <form onSubmit={handleSubmitNew}>
          <br />
          {wallpaperTable}
          <br />
          <h4>Add this modification to existing scenario, or create a new scenario</h4>
          <datalist id="scenariolist">
            {savedScenarios.map(item => <option key={item.name} value={item.name} />)}
          </datalist>
          <input
            type="search"
            id="scenarioName"
            list="scenariolist"
            value={scenarioName}
            onChange={(event) => setScenarioName(event.currentTarget.value)}
          />
          <br />
{/*          <HTMLSelect
            options={savedScenarios.map(item => item.name)}
          />*/}
          <button type="submit">Submit</button>
        </form>
      </div>
    );
  } else {
    return <div />
  }
}
