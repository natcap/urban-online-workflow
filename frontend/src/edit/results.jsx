import React, { useState, useEffect } from 'react';

import {
  Divider,
  HTMLSelect,
  HTMLTable,
  Icon,
} from '@blueprintjs/core';

import landuseCodes from '../../../appdata/NLCD_2016.lulcdata.json';

const METRICS = {
  avg_tmp_v: {
    label: 'change in temperature',
    units: `${'\u00b0'}F`,
    precision: 2,
  },
  tot_c_cur: {
    label: 'change in carbon stored',
    units: 'metric tons',
    precision: 0,
  },
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
      Object.entries(METRICS).forEach(([metric, obj]) => {
        data[name][obj.label] = {
          value: results[name][metric] - results['baseline'][metric],
          units: obj.units,
          precision: obj.precision,
        };
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
      setTemperature(parseFloat(table[scenarioName][METRICS['avg_tmp_v'].label].value));
      setCarbon(parseFloat(table[scenarioName][METRICS['tot_c_cur'].label].value));
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
        &deg;F for areas within {COOLING_DISTANCE} of <b>{studyAreaName}</b>.
      </li>
      <br />
      <li>
        Carbon storage is expected to <b>{carbonDirection} by {Math.abs(carbon).toFixed(0)}</b> metric tons
      </li>
    </ul>
  );

  const { census } = results.baseline;
  const populations = Object.entries(census.race)
    .sort(([, a], [, b]) => b - a);

  const povertyPar = (
    <ul>
      <li>
        <b>{census.poverty[HOUSE_SNAP]} households received</b> Food Stamps or SNAP.
      </li>
      <p className="hanging-indent">
        Of those households, <b>{census.poverty[`${HOUSE_SNAP} | ${INCOME_BELOW}`]} were below poverty level </b>
        and <b>{census.poverty[`${HOUSE_SNAP} | ${INCOME_ABOVE}`]} were above</b>.
      </p>
      <li>
        <b>{census.poverty[HOUSE_NO_SNAP]} households did not receive</b> Food Stamps or SNAP.
      </li>
      <p className="hanging-indent">
        Of those households, <b>{census.poverty[`${HOUSE_NO_SNAP} | ${INCOME_BELOW}`]} were below poverty level </b>
        and <b>{census.poverty[`${HOUSE_NO_SNAP} | ${INCOME_ABOVE}`]} were above</b>.
      </p>
    </ul>
  );

  return (
    <div id="results">
      <div className="panel" key={scenarioName}>
        <h4>
          In scenario,
          <HTMLSelect
            onChange={(event) => changeScenario(event.currentTarget.value)}
            value={scenarioName || ''}
          >
            {scenarioNames
              .map((name) => <option key={name} value={name}>{name}</option>)}
          </HTMLSelect>
          <span style={{ 'paddingLeft': '2rem' }}>landcover changed,</span>
        </h4>
        {landcoverDescription}
        <hr />
        {paragraphs}
      </div>
      {
        (scenarioNames.length > 1)
          ? (
            <div>
              <p>
                Each scenario's impact relative to baseline conditions:
              </p>
              <HTMLTable>
                <tbody>
                  <tr key="header">
                    <th key="blank" />
                    {Object.values(METRICS).map((obj) => (
                      <th key={obj.label}>{obj.label}</th>
                    ))}
                  </tr>
                  {scenarioNames.map((name) => (
                    <tr key={name}>
                      <th>{name}</th>
                      {Object.values(table[name]).map((obj) => (
                        <td className="table-value" key={obj.units}>
                          {(obj.value > 0) ? `+${obj.value.toFixed(obj.precision)}` : obj.value.toFixed(obj.precision)}
                          <span className="units">{obj.units}</span>
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </HTMLTable>
            </div>
          ) : <div />
      }
      <h2 id="demographics-header">
        <Icon icon="people" size="30"/>
        Demographics of the impacted area:
      </h2>
      <div id="demographics-body">
        <div>
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
        </div>
        {/*<Divider />*/}
        <div id="acs-container">
          {povertyPar}
        </div>
      </div>
      <div id="demographics-footer">
        <p>Data from the American Community Survey, 2020</p>
      </div>
    </div>
  );
}
