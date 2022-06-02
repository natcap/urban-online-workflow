import React, { useState, useEffect } from 'react';

import { wallpaper, getLULCTableForParcel } from './requests';
import Scenario from './scenario';

function makeInfoTable(lulcTable) {
  const rows = [];
  Object.entries(lulcTable).forEach((row) => {
    rows.push(
      <tr>
        <td>{row[0]}</td>
        <td>{row[1]}</td>
      </tr>
    );
  });
  return (
    <table>
      <tbody>
        {rows}
      </tbody>
    </table>
  );
}

export default function EditMenu(props) {
  const {
    open,
    selectedParcel, // coords
    scenario, // handed down from App so this is 'baseline'
    saveScenario,
  } = props;

  const [baseScene, setBaseScene] = useState('');
  const [baseTable, setBaseTable] = useState(null);
  const [newScene, setNewScene] = useState(null);
  const [newTable, setNewTable] = useState(null);
  const [scenarioName, setScenarioName] = useState('');
  const [pattern, setPattern] = useState('');

  useEffect(() => {
    setBaseScene(scenario);
  }, [scenario]);
  useEffect(async () => {
    if (selectedParcel) {
      setBaseTable(await getLULCTableForParcel(selectedParcel, baseScene));
    }
  }, [selectedParcel, baseScene]);
  useEffect(async () => {
    if (newScene) {
      setNewTable(await getLULCTableForParcel(selectedParcel, newScene));
    }
  }, [selectedParcel, newScene]);

  async function handleSubmit(event) {
    event.preventDefault();
    console.log(`wallpapering ${scenarioName}`);
    console.log(`wallpapering with ${pattern}`);
    const scene = new Scenario(scenarioName);
    // TODO: request do wallpapering
    // await wallpaper(selectedParcel, pattern, scene)
    saveScenario(scene); // for a list of available from home screen.
    setNewScene(scene);
  }

  function handleRadio(event) {
    setPattern(event.target.value);
  }

  const wallpaperTable = (
    <div>
      <input
        type="radio"
        id="pattern1"
        name="pattern"
        value="orchard"
        checked={pattern === "orchard"}
        onChange={handleRadio}
      />
      <label htmlFor="pattern1">
        orchard
        <img src="/wallpaper_sample.png" />
      </label>
      <input
        type="radio"
        id="pattern2"
        name="pattern"
        value="city park"
        checked={pattern === "city park"}
        onChange={handleRadio}
      />
      <label htmlFor="pattern2">
        city park
        <img src="/wallpaper_sample.png" />
      </label>
      <input
        type="radio"
        id="pattern3"
        name="pattern"
        value="commercial"
        checked={pattern === "commercial"}
        onChange={handleRadio}
      />
      <label htmlFor="pattern3">
        commercial
        <img src="/wallpaper_sample.png" />
      </label>
    </div>
  );

  if (open) {
    return (
      <div className="menu-container">
        <h4>The selected parcel contains:</h4>
        {baseTable ? makeInfoTable(baseTable) : <div />}
        <h4>{`In new scenario:`}</h4>
        {newTable ? makeInfoTable(newTable) : <div />}
        <form onSubmit={handleSubmit}>
          <label htmlFor="scenarioName">Choose name for a future landuse scenario:</label>
          <br />
          <input
            type="text"
            id="scenarioName"
            value={scenarioName}
            onChange={(event) => setScenarioName(event.currentTarget.value)}
          />
          <h4>Modify the landuse of the parcel by selecting a pattern:</h4>
          {wallpaperTable}
          <button type="submit">Submit</button>
        </form>
      </div>
    );
  } else {
    return <div />
  }
}
