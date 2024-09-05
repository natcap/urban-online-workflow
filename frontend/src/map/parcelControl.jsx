import React, { useState } from 'react';

import {
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
    immutableStudyArea,
  } = props;

  const [jobID, setJobID] = useState(null);

  useInterval(async () => {
    const status = await getJobStatus(jobID);
    // We don't care about success vs failure, either way stop requesting
    // new study area data. Other components handle the missing data 
    // that comes from failure.
    if (!['pending', 'running'].includes(status)) {
      setJobID(null);
      refreshStudyArea();
    }
  }, (jobID) ? 200 : null); // This server operation should be quick

  const handleClick = async (parcel) => {
    const jid = await addParcel(
      sessionID,
      activeStudyAreaID,
      parcel.parcelID,
      parcel.address,
      parcel.coords
    );
    refreshStudyArea();
    setJobID(jid.job_id);
  };

  if (parcel) {
    return (
      <div className="layer-info">
        <p>{parcel.address}</p>
        <div>
          <Button
            onClick={() => handleClick(parcel)}
            icon="add"
            disabled={immutableStudyArea}
            intent="primary"
          >
            Add to study area
          </Button>
          <Button
            onClick={clearSelection}
            icon="remove"
          >
            Clear
          </Button>
        </div>
      </div>
    );
  }
  return <div />;
}
