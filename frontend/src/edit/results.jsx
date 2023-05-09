import React, { useState } from 'react';

import {
  Button,
  HTMLTable,
} from '@blueprintjs/core';

const METRICS = {
  'avg_tmp_v': 'change in average temperature',
  'tot_c_cur': 'change in carbon stored',
};
const COOLING_DISTANCE = '450 meters';
const HOUSE_SNAP = 'Household received Food Stamps or SNAP in the past 12 months';
const HOUSE_NO_SNAP = 'Household did not receive Food Stamps or SNAP in the past 12 months';
const INCOME_BELOW = 'Income in the past 12 months below poverty level';
const INCOME_ABOVE = 'Income in the past 12 months at or above poverty level';

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
      <div className="panel" key={name}>
        <p>As a result of the landuse change in scenario <b>{name}</b>,</p>
        <p>
          maximum daytime <b>temperatures</b> during August are 
          expected to <b>{tempDirection} by {Math.abs(temperature).toFixed(2)} </b> 
          degrees F for areas within {COOLING_DISTANCE} of <b>{studyAreaName}</b>.
        </p>
      </div>
    );
  });

  const populations = Object.entries(census.race)
    .sort(([,a], [,b]) => b - a);

  const povertyPar = (
    <div>
      <p>
        <b>{census.poverty[HOUSE_SNAP]} households received</b> Food Stamps or SNAP in the past 12 months.
      </p>
      <p className="hanging-indent">
        Of those households, <b>{census.poverty[`${HOUSE_SNAP} | ${INCOME_BELOW}`]} were below poverty level </b>
        and <b>{census.poverty[`${HOUSE_SNAP} | ${INCOME_ABOVE}`]} were above</b>.
      </p>
      <p>
        <b>{census.poverty[HOUSE_NO_SNAP]} households did not receive</b> Food Stamps or SNAP in the past 12 months.
      </p>
      <p className="hanging-indent">
        Of those households, <b>{census.poverty[`${HOUSE_NO_SNAP} | ${INCOME_BELOW}`]} were below poverty level </b>
        and <b>{census.poverty[`${HOUSE_NO_SNAP} | ${INCOME_ABOVE}`]} were above</b>.
      </p>
    </div>
  );

  return (
    <div>
      {/*<pre>{JSON.stringify(results, null, 2)}</pre>*/}
      {paragraphs}
      <h2>Demographics of the impacted area</h2>
      <h3>Population by race</h3>
      {/*<pre>{JSON.stringify(populations, null, 2)}</pre>*/}
      <HTMLTable className="bp4-html-table-condensed">
        <tbody>
          {populations.map(([group, count]) => (
            <tr key={group}>
              <td key="group">{group}</td>
              <td key="count">{count}</td>
            </tr>
          ))}
        </tbody>
      </HTMLTable>
      <h3 id="poverty-heading">Poverty metrics, according to the American Community Survey</h3>
      {povertyPar}
      {/*<pre>{JSON.stringify(census.poverty, null, 2)}</pre>*/}
      {/*<pre>{JSON.stringify(data, null, 2)}</pre>*/}
    </div>
  );
}
