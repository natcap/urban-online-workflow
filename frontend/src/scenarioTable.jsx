import React, { useState, useEffect } from 'react';

import {
  HTMLTable,
} from '@blueprintjs/core';

import {
  getScenario,
  // getLulcCodes,
} from './requests';

export default function ScenarioTable(props) {
  const { scenarioLookup } = props;

  const [scenarioData, setScenarioData] = useState(null);
  const [lulcNames, setLulcNames] = useState([]);

  useEffect(async () => {
    const scenarios = await Promise.all(
      Object.keys(scenarioLookup).map((id) => getScenario(id))
    );
    setScenarioData(scenarios);
  }, [scenarioLookup]);

  useEffect(async () => {
    const lulcCodes = await getLulcCodes();
    setLulcNames(Object.values(lulcCodes));
  }, []);

  if (!scenarioData) {
    return <p>No scenarios have been created</p>;
  }

  const lulcHeader = (
    <tr key="header">
      <td key="header"> </td>
      {lulcNames.map((type) => <td key={type}>{type}</td>)}
    </tr>
  );

  const rows = [];
  rows.push(lulcHeader);
  scenarioData.forEach((scen) => {
    rows.push(
      <tr key={scen.name}>
        <td key={scen.name}><em><b>{scen.name}</b></em></td>
        {lulcNames.map((type) => <td key={type}> </td>)}
      </tr>
    );
    Object.values(scen.features).forEach((feature) => {
      rows.push(
        <tr key={feature.fid}>
          <td key={feature.fid}>{feature.fid}</td>
          {lulcNames.map((type) => <td key={type}>{feature.table[type]}</td>)}
        </tr>
      );
    });
  });

  return (
    <HTMLTable bordered striped className="scenario-table">
      <tbody>
        {rows}
      </tbody>
    </HTMLTable>
  );
}
