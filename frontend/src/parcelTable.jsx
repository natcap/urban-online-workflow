import React from 'react';

import {
  HTMLTable,
  Button,
} from '@blueprintjs/core';

export default function ParcelTable(props) {
  const {
    parcel,
    addParcel,
  } = props;

  if (!parcel) {
    return <p className="sidebar-subheading">Select a parcel to modify</p>;
  }

  const nPixels = Object.values(parcel.table)
    .reduce((partialSum, x) => partialSum + x, 0);
  const rows = [];
  Object.entries(parcel.table).forEach(([name, count]) => {
    rows.push(
      <tr key={name}>
        <td key="name">{name}</td>
        <td key="count">{`${Math.round((count / nPixels) * 100)} %`}</td>
      </tr>,
    );
  });
  return (
    <div>
      <p className="sidebar-subheading">Selected parcel:</p>
      <HTMLTable bordered striped>
        <tbody>
          {rows}
        </tbody>
      </HTMLTable>
      <Button onClick={() => addParcel(parcel)}>
        Add to scenario
      </Button>
    </div>
  );
}
