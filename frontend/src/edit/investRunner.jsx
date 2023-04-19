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
  // useInterval(async () => {
  //   // There are sometimes two jobs submitted concurrently.
  //   // They are in a priority queue, so for now monitor the lower priority one.
  //   console.log('checking status for job', jobID);
  //   const status = await getJobStatus(jobID);
  //   if (status === 'success') {
  //     refreshScenarios();
  //     setJobID(null);
  //   }
  // }, (jobID && scenarioID) ? 1000 : null);

  const handleClick = async () => {
    console.log(props.scenarios)
    const jobs = await Promise.all(props.scenarios.map((scenario) => runInvest(scenario.scenario_id)));
    console.log(jobs);
  };

  return (
    <Button
      onClick={handleClick}
    >
      Run InVEST Models
    </Button>
  );
}
