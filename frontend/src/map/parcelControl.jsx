import React, { useState } from 'react';

import {
  HTMLTable,
  Button,
} from '@blueprintjs/core';

import useInterval from '../hooks/useInterval';
import {
  getJobStatus,
  addParcel,
} from '../requests';

export default function ParcelControl(props) {
  const {
    parcel,
    clearSelection,
    sessionID,
    activeStudyAreaID,
    refreshStudyArea,
  } = props;

  const [jobID, setJobID] = useState(null);

  useInterval(async () => {
    const status = await getJobStatus(jobID);
    if (!['pending', 'running'].includes(status)) {
      setJobID(null);
      refreshStudyArea();
    }
  }, (jobID) ? 200 : null); // This server operation should be quick

  const handleClick = async (parcel) => {
    const jid = await addParcel(sessionID, activeStudyAreaID, parcel.parcelID, parcel.coords);
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
