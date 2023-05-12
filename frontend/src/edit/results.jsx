import React, { useState, useEffect } from 'react';

import {
  HTMLSelect,
  HTMLTable,
} from '@blueprintjs/core';

import landuseCodes from '../../../appdata/NLCD_2016.lulcdata.json';

const METRICS = {
  'avg_tmp_v': 'change in temperature',
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
    scenarioDescriptions,
    setSelectedScenario,
  } = props;

  const [scenarioName, setScenarioName] = useState(null);
  const [temperature, setTemperature] = useState(null);
  const [carbon, setCarbon] = useState(null);
  const [table, setTable] = useState(null);
  const [scenarioNames, setScenarioNames] = useState([]);
  const [fromLULC, setFromLULC] = useState([]);
  const [toLULC, setToLULC] = useState([]);

  const changeScenario = (name) => {
    setScenarioName(name);
    setSelectedScenario(name);
  };

  useEffect(() => {
    const data = {};
    const names = Object.keys(results).filter((key) => key !== 'baseline');
    names.forEach((name) => {
      data[name] = {};
      Object.entries(METRICS).forEach(([metric, label]) => {
        data[name][label] = results[name][metric] - results['baseline'][metric];
      });
    });
    const from = scenarioDescriptions['baseline'].map((code) => {
      return landuseCodes[code].name
    });
    setFromLULC(from);
    setTable(data);
    setScenarioNames(names);
    setScenarioName(names.slice(-1)[0]);
  }, [results]);

  useEffect(() => {
    if (scenarioName) {
      setTemperature(parseFloat(table[scenarioName][METRICS['avg_tmp_v']]));
      setCarbon(parseFloat(table[scenarioName][METRICS['tot_c_cur']]));
      const to = scenarioDescriptions[scenarioName].map((code) => {
        return landuseCodes[code].name
      });
      setToLULC(to);
    }
  }, [scenarioName]);

  const landcoverDescription = (
    <>
      <p className="hanging-indent">
        <b>from: </b>{(fromLULC.length > 1) ? 'mostly ' : ''}
        <em>{fromLULC.join(', ')}</em>
      </p>
      <p className="hanging-indent">
        <b>to: </b>{(toLULC.length > 1) ? 'mostly ' : ''}
        <em>{toLULC.join(', ')}</em>
      </p>
    </>
  );

  const tempDirection = (temperature >= 0) ? 'increase' : 'decrease';
  const carbonDirection = (carbon >= 0) ? 'increase' : 'decrease';
  const paragraphs = (
    <ul>
      <li>
        The average daytime high <b>temperature</b> during August is 
        expected to <b>{tempDirection} by {Math.abs(temperature).toFixed(2)} </b> 
        degrees F for areas within {COOLING_DISTANCE} of <b>{studyAreaName}</b>.
      </li>
      <br />
      <li>
        Carbon storage is expected to <b>{carbonDirection} by {Math.abs(carbon).toFixed(2)}</b> metric tons
      </li>
    </ul>
  );

  const { census } = results.baseline;
  const populations = Object.entries(census.race)
    .sort(([, a], [, b]) => b - a);

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
    <div id="results">
      <div className="panel" key={scenarioName}>
        <p>
          <h4>
            In scenario,
            <HTMLSelect
              onChange={(event) => changeScenario(event.currentTarget.value)}
              value={scenarioName}
            >
              {scenarioNames
                .map((name) => <option key={name} value={name}>{name}</option>)}
            </HTMLSelect>
            <span style={{ 'padding-left': '2rem' }}>landcover changed,</span>
          </h4>
        </p>
        {landcoverDescription}
        <hr />
        {paragraphs}
      </div>
      {
        (scenarioNames.length > 1)
          ? (
            <HTMLTable>
              <tbody>
                <tr>
                  <th key="blank" />
                  {scenarioNames.map((name) => <th key={name}>{name}</th>)}
                </tr>
                {Object.values(METRICS).map((label) => (
                  <tr key={label}>
                    <th key="label">{label}</th>
                    {scenarioNames.map((name) => (
                      <td key={name}>{table[name][label].toFixed(2)}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </HTMLTable>
          ) : <div />
      }
      <h2>Demographics of the impacted area:</h2>
      <h3>Population by race</h3>
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
    </div>
  );
}
