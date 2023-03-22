import React, { useState } from 'react';

import {
  HTMLTable,
  Button,
} from '@blueprintjs/core';

import useInterval from '../hooks/useInterval';
import {
  // getLulcTableForParcel,
  getJobStatus,
  addParcel,
} from '../requests';

export default function ParcelControl(props) {
  const {
    parcel,
    // addParcel,
    clearSelection,
    sessionID,
    activeStudyAreaID,
    updateStudyArea,
  } = props;

  const [jobID, setJobID] = useState(null);

  useInterval(async () => {
    // const results = await getLulcTableForParcel(jobID);
    const status = await getJobStatus(jobID);
    if (!['pending', 'running'].includes(status)) {
      // const addition = {
      //   [parcel.parcelID]: {
      //     coords: parcel.coords,
      //     table: JSON.parse(results).base, // TODO: do we need the scenario identifier in these results?
      //   },
      // };
      setJobID(null);
      // addParcel(addition);
      updateStudyArea();
    }
  }, (jobID) ? 200 : null); // This server operation should be quick

  const handleClick = async (parcel) => {
    console.log(activeStudyAreaID)
    const jid = await addParcel(sessionID, activeStudyAreaID, parcel.coords);
    setJobID(jid.job_id);
  };

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
