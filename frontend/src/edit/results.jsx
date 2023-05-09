import React, { useState } from 'react';

import {
  Button,
  ProgressBar,
} from '@blueprintjs/core';

const METRICS = {
  'avg_tmp_v': 'change in average temperature',
  'tot_c_cur': 'change in carbon stored',
};
const COOLING_DISTANCE = '450 meters';

export default function Results(props) {
  const {
    results,
    studyAreaName,
  } = props;
  console.log(results)

  const { census } = results.baseline;
  const scenarioNames = Object.keys(results).filter(key => key !== 'baseline');
  const data = {};
  const paragraphs = [];
  scenarioNames.forEach((name) => {
    data[name] = {};
    Object.entries(METRICS).forEach(([metric, label]) => {
      data[name][label] = results[name][metric] - results['baseline'][metric];
    });
    const temperature = parseFloat(data[name][METRICS['avg_tmp_v']]);
    const tempDirection = (temperature >= 0) ? 'increase' : 'decrease';
    paragraphs.push(
      <p key={name}>
        As a result of the landuse change in scenario {name},
        maximum daytime temperatures during August are 
        expected to {tempDirection} by {Math.abs(temperature).toFixed(2)} 
        degrees F for areas within {COOLING_DISTANCE} of {studyAreaName}.
      </p>
    );
  });

  return (
    <div>
      {/*<pre>{JSON.stringify(results, null, 2)}</pre>*/}
      {paragraphs}
      <pre>{JSON.stringify(data, null, 2)}</pre>
      <pre>{JSON.stringify(census, null, 2)}</pre>
    </div>
  );
}
