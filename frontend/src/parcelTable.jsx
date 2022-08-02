import React from 'react';

import {
  HTMLTable,
} from '@blueprintjs/core';

export default function ParcelTable(props) {
  const { parcelTable } = props;

  if (!parcelTable) {
    return <p className="sidebar-subheading">Select a parcel to modify</p>;
  }

  const nPixels = Object.values(parcelTable)
    .reduce((partialSum, x) => partialSum + x, 0);
  const rows = [];
  Object.entries(parcelTable).forEach(([name, count]) => {
    rows.push(
      <tr key={name}>
        <td key="name">{name}</td>
        <td key="count">{`${Math.round((count / nPixels) * 100)} %`}</td>
      </tr>,
    );
  });
  return (
    <div>
      <p className="sidebar-subheading">Selected parcel contains:</p>
      <HTMLTable bordered striped>
        <tbody>
          {rows}
        </tbody>
      </HTMLTable>
    </div>
  );
}
