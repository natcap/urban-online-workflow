import React, { useState, useEffect } from 'react';

import {
  HTMLTable,
} from '@blueprintjs/core';

import {
  getScenario,
  getLulcCodes,
} from './requests';

export default function ScenarioTable(props) {
  const { scenarioLookup } = props;

  const [scenarioData, setScenarioData] = useState(null);
  const [lulcNames, setLulcNames] = useState(null);

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
    return <div />;
  }

  const lulcHeader = (
    <tr>
      <td> </td>
      {lulcNames.map((type) => <td>{type}</td>)}
    </tr>
  );

  const rows = [];
  rows.push(lulcHeader);
  scenarioData.forEach((scen) => {
    rows.push(
      <tr>
        <td><em><b>{scen.name}</b></em></td>
        {lulcNames.map((type) => <td> </td>)}
      </tr>
    );
    Object.values(scen.features).forEach((feature) => {
      rows.push(
        <tr>
          <td>{feature.fid}</td>
          {lulcNames.map((type) => <td>{feature.table[type]}</td>)}
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
