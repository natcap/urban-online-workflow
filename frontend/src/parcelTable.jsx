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
    clearSelection,
    sessionID,
  } = props;

  const [jobID, setJobID] = useState(null);

  useInterval(async () => {
    const results = await getLulcTableForParcel(jobID);
    if (!['pending', 'running'].includes(results)) {
      const addition = {
        [parcel.parcelID]: {
          coords: parcel.coords,
          table: results,
        },
      };
      setJobID(null);
      addParcel(addition);
    }
  }, (jobID) ? 200 : null); // This server operation should be quick

  const handleClick = async (parcel) => {
    const jid = await postLulcTableForParcel(sessionID, parcel.coords);
    setJobID(jid.job_id);
  };

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

  return (
    <div className="layer-info">
      {(!parcel)
        ? <p>Select a parcel</p>
        : (
          <>
            <HTMLTable bordered>
              <tbody>
                <tr key="parcel">
                  <td key="id">{parcel.parcelID}</td>
                  <td key="address">{parcel.address || '123 Main St'}</td>
                </tr>
              </tbody>
            </HTMLTable>
            <Button
              onClick={() => handleClick(parcel)}
              icon="Add"
            >
              Add to study area
            </Button>
            <Button
              onClick={clearSelection}
              icon="remove"
            />
          </>
        )}
    </div>
  );
}
