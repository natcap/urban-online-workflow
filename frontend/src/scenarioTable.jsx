import React, { useState, useEffect } from 'react';

import landuseCodes from './landuseCodes';

import {
  HTMLTable,
  Button
} from '@blueprintjs/core';

function sqkm(count) {
  if (!parseInt(count)) {
    return ''
  }
  const num = count * 0.030 * 0.030;
  return num.toFixed(2)
}

export default function ScenarioTable(props) {
  const { scenarioTable } = props;
  console.log(scenarioTable)

  const [lulcNames, setLulcNames] = useState([]);

  const scenarioHeader = (
    <tr key="header">
      <td key="0_0" className="table-note">(area in square km)</td>
      {Object.keys(scenarioTable).map(
        (name) => <td key={name}><div className="header"><span>{name}</span></div></td>
      )}
    </tr>
  );

  const rows = [];
  rows.push(scenarioHeader);
  Object.keys(landuseCodes).forEach((code) => {
    const counts = [];
    Object.entries(scenarioTable).forEach(([name, table]) => {
      const count = scenarioTable[name][code] || '';
      counts.push(count);
    })
    if (counts.reduce((x, y) => (x || 0) + (y || 0), 0)) { // skip rows of all 0s
      const cells = [];
      cells.push(
        <td key={code} className="row-name" style={{
          borderLeftColor: landuseCodes[code].color
        }}>
          {landuseCodes[code].name}
        </td>)
      cells.push(...counts.map((c, idx) => <td key={idx}>{sqkm(c)}</td>))
      rows.push(<tr key={code}>{cells}</tr>);
    }
  });

  return (
    <>
    <HTMLTable bordered striped className="scenario-table">
      <tbody>
        {rows}
      </tbody>
    </HTMLTable>
    <br />
    <Button>
      Run InVEST Models
    </Button>
    </>
  );
}
