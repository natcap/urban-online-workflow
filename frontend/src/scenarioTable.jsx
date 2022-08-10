import React, { useState, useEffect } from 'react';

import {
  HTMLTable,
  Button,
} from '@blueprintjs/core';

export default function ScenarioTable(props) {
  const { parcelSet } = props;

  // const [lulcNames, setLulcNames] = useState([]);

  // useEffect(async () => {
  //   const lulcCodes = await getLulcCodes();
  //   setLulcNames(Object.values(lulcCodes));
  // }, []);

  const rows = [];
  Object.entries(parcelSet).forEach(([id, data]) => {
    rows.push(
      <tr>
        <td>{id}</td>
        <td>{JSON.stringify(data.table)}</td>
      </tr>
    );
  });

  return (
    <>
      <HTMLTable bordered striped className="scenario-table">
        <tbody>
          {rows}
        </tbody>
      </HTMLTable>
    </>
  );
}
