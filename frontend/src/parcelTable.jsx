import React, { useState } from 'react';

import {
  HTMLTable,
  Button,
} from '@blueprintjs/core';

import useInterval from './hooks/useInterval';
import {
  getLulcTableForParcel,
  postLulcTableForParcel,
} from './requests';

export default function ParcelTable(props) {
  const {
    parcel,
    addParcel,
    sessionID,
  } = props;

  const [jobID, setJobID] = useState(null);

  useInterval(async () => {
    const results = await getLulcTableForParcel(jobID);
    const addition = {
      [parcel.parcelID]: {
        coords: parcel.coords,
        table: results,
      },
    };
    setJobID(null);
    addParcel(addition);
  }, (jobID) ? 1000 : null);

  const handleClick = async (parcel) => {
    const jid = await postLulcTableForParcel(sessionID, parcel.coords);
    setJobID(jid);
  }

  if (!parcel) {
    return <p className="sidebar-subheading">Select a parcel to modify</p>;
  }

  // const nPixels = Object.values(parcel.table)
  //   .reduce((partialSum, x) => partialSum + x, 0);
  // const rows = [];
  // Object.entries(parcel.table).forEach(([name, count]) => {
  //   rows.push(
  //     <tr key={name}>
  //       <td key="name">{name}</td>
  //       <td key="count">{`${Math.round((count / nPixels) * 100)} %`}</td>
  //     </tr>,
  //   );
  // });
  const rows = [
    <tr key="parcel">
      <td key="id">{parcel.parcelID}</td>
      <td key="address">{parcel.address || '123 Main St'}</td>
    </tr>,
  ];
  return (
    <div>
      <p className="sidebar-subheading">Selected parcel:</p>
      <HTMLTable bordered striped>
        <tbody>
          {rows}
        </tbody>
      </HTMLTable>
      <Button onClick={() => handleClick(parcel)}>
        Add to scenario
      </Button>
    </div>
  );
}
