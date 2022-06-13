import React, { useState, useEffect } from 'react';

import {
  HTMLTable,
} from '@blueprintjs/core';

import {
  getLulcCodes,
} from './requests';

export default function ParcelTable(props) {
  const { parcelTable } = props;

  const [lulcNames, setLulcNames] = useState([]);

  useEffect(async () => {
    const lulcCodes = await getLulcCodes();
    setLulcNames(Object.values(lulcCodes));
  }, []);

  const lulcHeader = (
    <tr key="row1">
      <td key="col1"> </td>
      {lulcNames.map((type) => <td key={type}>{type}</td>)}
    </tr>
  );

  const rows = [];
  rows.push(lulcHeader);
  rows.push(
    <tr key="row2">
      <td key="col1"> </td>
      {lulcNames.map((type) => <td key={type}>{parcelTable[type]}</td>)}
    </tr>
  );
  return (
    <div>
      <h4>Selected parcel contains:</h4>
      <HTMLTable bordered striped>
        <tbody>
          {rows}
        </tbody>
      </HTMLTable>
    </div>
  );
}
