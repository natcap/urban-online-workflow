import React, { useState, useEffect } from 'react';

import {
  HTMLSelect,
  HTMLTable,
  Icon,
} from '@blueprintjs/core';

import ResultsDemographics from './resultsDemographics';

const METRICS = {
  avg_tmp_v: {
    label: 'change in temperature',
    units: `${'\u00b0'}F`,
    precision: 2,
  },
  cdd_cost: {
    label: 'change in cooling cost',
    units: 'USD',
    precision: 0,
  },
  tot_c_cur: {
    label: 'change in carbon stored',
    units: 'metric tons',
    precision: 0,
  },
  nature_supply_percapita: {
    label: 'change in supply of natural areas',
    units: 'square meters per person',
    precision: 2,
  },
};
const COOLING_DISTANCE = '450 meters';

function LandcoverDescription(props) {
  const {
    scenarioDescriptions,
    scenarioName,
  } = props;

  const from = (scenarioDescriptions['baseline']['nlcd'].length)
    ? `
        ${scenarioDescriptions['baseline']['nlcd'].join(', ')}
        ( ${scenarioDescriptions['baseline']['nlud'].join(', ')} )
      `
    : '';

  const to = (scenarioDescriptions[scenarioName]['nlcd'].length)
    ? `
        ${scenarioDescriptions[scenarioName]['nlcd'].join(', ')}
        ( ${scenarioDescriptions[scenarioName]['nlud'].join(', ')} )
      `
    : '';

  return (
    <>
      <p className="hanging-indent">
        <b>from: </b>
        mostly <em>{from}</em>
      </p>
      <p className="hanging-indent">
        <b>to: </b>
        mostly <em>{to}</em>
      </p>
    </>
  );
}

export default function Results(props) {
  const {
    results,
    studyAreaName,
    scenarioDescriptions,
    setSelectedScenario,
  } = props;

  const [scenarioName, setScenarioName] = useState(null);
  const [table, setTable] = useState(null);
  const [scenarioNames, setScenarioNames] = useState([]);

  const changeScenario = (name) => {
    setScenarioName(name);
    setSelectedScenario(name);
  };

  useEffect(() => {
    console.log(results)
    const data = {};
    const names = Object.keys(results).filter((key) => key !== 'baseline');
    names.forEach((name) => {
      data[name] = {};
      Object.entries(METRICS).forEach(([metric, obj]) => {
        data[name][metric] = {
          value: results[name][metric] - results['baseline'][metric],
          units: obj.units,
          precision: obj.precision,
          label: obj.label,
        };
      });
    });
    setTable(data);
    setScenarioNames(names);
    setScenarioName(names.slice(-1)[0]);
  }, [results]);

  // useEffect(() => {
  //   if (scenarioName) {
  //     // const to = (scenarioDescriptions[scenarioName]['nlcd'].length)
  //     //   ? `
  //     //       ${scenarioDescriptions[scenarioName]['nlcd'].join(', ')}
  //     //       ( ${scenarioDescriptions[scenarioName]['nlud'].join(', ')} )
  //     //     `
  //     //   : '';
  //     // setToLULC(to);
  //   }
  // }, [scenarioName]);

  let paragraphs;
  if (table && table[scenarioName]) {
    const temperature = table[scenarioName]['avg_tmp_v'].value;
    const coolingCost = table[scenarioName]['cdd_cost'].value;
    const tempDirection = (temperature >= 0) ? 'increase' : 'decrease';

    const carbon = table[scenarioName]['tot_c_cur'].value;
    const carbonDirection = (carbon >= 0) ? 'increase' : 'decrease';

    const natureSupplyScen = results[scenarioName]['nature_supply_percapita'];
    const natureSupplyBase = results['baseline']['nature_supply_percapita'];
    const natureSupplyDelta = natureSupplyScen - natureSupplyBase;
    const natureSupplyPercentChange = (natureSupplyDelta / natureSupplyBase) * 100;
    const natureDirection = (natureSupplyDelta >= 0) ? 'increase' : 'decrease';
    const natureBalance = results['baseline']['ntr_bal_avg'];
    const natureBalanceScen = results[scenarioName]['ntr_bal_avg'];
    // const natureBalanceLabel = (natureBalance >= 0) ? 'surplus' : 'deficit';
    console.log(natureSupplyDelta)
    console.log(natureBalance)
    console.log(natureBalanceScen)
    const natureBalanceDemandMet = ((natureBalance + 16.7) / 16.17) * 100;
    const natureBalanceDemandMetScenario = ((natureBalanceScen + 16.7) / 16.17) * 100;
    paragraphs = (
      <ul>
        <li>
          <Icon icon="Flash" />
          <p>
            <span>
              The average daytime high <b>temperature</b> during August is expected to
              <b> {tempDirection} by {Math.abs(temperature).toFixed(METRICS.avg_tmp_v.precision)} &deg;F </b>
              for areas within {COOLING_DISTANCE} of <b>{studyAreaName}</b>.
            </span>
          </p>
          <p>
            <span>
              This represents an <b>{tempDirection} </b>
              in total cooling costs by
              <b> ${Math.abs(coolingCost).toFixed(METRICS.cdd_cost.precision)}</b>
            </span>
          </p>
        </li>
        <br />
        <li>
          <Icon icon="tree" />
          <span>
            Carbon storage is expected to
            <b> {carbonDirection} by {Math.abs(carbon).toFixed(METRICS.tot_c_cur.precision)} </b>
            metric tons
          </span>
        </li>
        <br />
        <li>
          <Icon icon="walk" />
          <span>
            Nature accessibility is expected to
            <b> {natureDirection} by {Math.abs(natureSupplyPercentChange).toFixed(METRICS.nature_supply_percapita.precision)}%. </b>
            In this study area the average person previously had access to {natureBalanceDemandMet.toFixed(METRICS.nature_supply_percapita.precision)}% of
            the natural area that would meet the typical need. Now they have access to {natureBalanceDemandMetScenario.toFixed(METRICS.nature_supply_percapita.precision)}%.
          </span>
        </li>
      </ul>
    );
  }

  return (
    <div id="results" data-testid="results">
      <div className="panel" key={scenarioName}>
        <h4>
          In scenario,
          <HTMLSelect
            aria-label="select scenario"
            onChange={(event) => changeScenario(event.currentTarget.value)}
            value={scenarioName || ''}
          >
            {scenarioNames
              .map((name) => <option key={name} value={name}>{name}</option>)}
          </HTMLSelect>
          <span style={{ 'paddingLeft': '2rem' }}>landcover (landuse) changed,</span>
        </h4>
        {
          (scenarioName)
            ? (
              <LandcoverDescription
                scenarioDescriptions={scenarioDescriptions}
                scenarioName={scenarioName}
              />
            )
            : <div />
        }
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
      <ResultsDemographics
        census={results.baseline.census}
      />
    </div>
  );
}
