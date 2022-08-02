import React, { useState, useEffect } from 'react';

import {
  HTMLTable,
} from '@blueprintjs/core';

import {
  getScenario,
} from './requests';

export default function ScenarioTable(props) {
  const { savedScenarios } = props;

  const [lulcNames, setLulcNames] = useState([]);

  useEffect(async () => {
    const lulcCodes = await getLulcCodes();
    setLulcNames(Object.values(lulcCodes));
  }, []);

  if (!savedScenarios || !savedScenarios.length) {
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
  savedScenarios.forEach((scen) => {
    rows.push(
      <tr key={scen.name}>
        <td key={scen.name}><em><b>{scen.name}</b></em></td>
        {lulcNames.map((type) => <td key={type}> </td>)}
      </tr>,
    );
    // Uncomment when https://github.com/natcap/urban-online-workflow/issues/40 is fixed
    // Object.values(scen.features).forEach((feature) => {
    //   rows.push(
    //     <tr key={feature.fid}>
    //       <td key={feature.fid}>{feature.fid}</td>
    //       {lulcNames.map((type) => <td key={type}>{feature.table[type]}</td>)}
    //     </tr>,
    //   );
    // });
  });

  return (
    <HTMLTable bordered striped className="scenario-table">
      <tbody>
        {rows}
      </tbody>
    </HTMLTable>
  );
}
