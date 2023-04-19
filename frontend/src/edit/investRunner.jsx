import React, { useState } from 'react';

import {
  Button,
} from '@blueprintjs/core';

import useInterval from '../hooks/useInterval';
import {
  getJobStatus,
  runInvest,
} from '../requests';

export default function InvestRunner(props) {
  const {
    scenarios,
    refreshScenarios,
  } = props;
  const [jobIDs, setJobIDs] = useState([]);

  useInterval(async () => {
    const statuses = await Promise.all(jobIDs.map((id) => getJobStatus(id)));
    const pendingJobs = [...jobIDs];
    statuses.forEach((status, idx) => {
      if (['success', 'failed'].includes(status)) {
        pendingJobs.splice(idx, 1);
      }
    });
    setJobIDs(pendingJobs);
    if (!pendingJobs.length) {
      refreshScenarios();
    }
  }, (jobIDs.length) ? 2000 : null);

  const handleClick = async () => {
    const jobs = await Promise.all(scenarios.map((scenario) => runInvest(scenario.scenario_id)));
    const jids = jobs.map((j) => Object.values(j));
    setJobIDs(jids.flat());
  };

  return (
    <Button
      onClick={handleClick}
    >
      Run InVEST Models
    </Button>
  );
}
