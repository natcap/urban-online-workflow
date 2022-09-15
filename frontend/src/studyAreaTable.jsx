import React, { useState, useEffect } from 'react';

import landuseCodes from './landuseCodes';

import {
  HTMLTable,
  Button
} from '@blueprintjs/core';

export default function StudyAreaTable(props) {
  const { scenarioTable } = props;
  console.log(scenarioTable)

  const [lulcNames, setLulcNames] = useState([]);

  const scenarioHeader = (
    <tr key="header">
      <td key="header"> </td>
      {Object.keys(scenarioTable).map((name) => <td key={name}>{name}</td>)}
    </tr>
  );

  const rows = [];
  rows.push(scenarioHeader);
  Object.keys(landuseCodes).forEach((code) => {
    const cells = [];
    cells.push(<td>{landuseCodes[code].name}</td>)
    Object.entries(scenarioTable).forEach(([name, table]) => {
      const count = scenarioTable[name][code] || 0;
      cells.push(<td key={name}>{count}</td>);
    })
    rows.push(<tr key={code}>{cells}</tr>);
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
