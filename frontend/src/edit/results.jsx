import React, { useState, useEffect } from 'react';

import {
  HTMLSelect,
  HTMLTable,
  Icon,
} from '@blueprintjs/core';

import ResultsDemographics from './resultsDemographics';
import {
  COOLING_DISTANCE_STR,
  NATURE_ACCESS_DISTANCE_STR,
  NAT_REQ_PERCAP,
} from '../constants';

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
    label: 'change in supply of nature',
    units: 'square meters per person',
    precision: 1,
  },
};

function LandcoverDescription(props) {
  const {
    scenarioDescriptions,
    scenarioName,
  } = props;

  return (
    <HTMLTable id="landcover-description">
      <tr>
        <th className="col-header">from mostly:</th>
        <th className="col-header">to:</th>
        <td />
      </tr>
      <tr>
        <td>{scenarioDescriptions['baseline']['nlcd'].join('\n')}</td>
        <td>{scenarioDescriptions[scenarioName]['nlcd'].join('\n')}</td>
        <td className="row-header">(landcover)</td>
      </tr>
      <tr>
        <td>{scenarioDescriptions['baseline']['nlud'].join('\n')}</td>
        <td>{scenarioDescriptions[scenarioName]['nlud'].join('\n')}</td>
        <td className="row-header">(landuse)</td>
      </tr>
      <tr>
        <td>{scenarioDescriptions['baseline']['tree']}</td>
        <td>{scenarioDescriptions[scenarioName]['tree']}</td>
        <td className="row-header">(tree cover)</td>
      </tr>
    </HTMLTable>
  );
}

function ResultsDescription(props) {
  const {
    results,
    deltaTable,
    scenarioName,
  } = props;

  const temperature = deltaTable[scenarioName]['avg_tmp_v'].value;
  const coolingCost = deltaTable[scenarioName]['cdd_cost'].value;
  const tempDirection = (temperature >= 0) ? 'increase' : 'decrease';

  const carbon = deltaTable[scenarioName]['tot_c_cur'].value;
  const carbonDirection = (carbon >= 0) ? 'increase' : 'decrease';

  const natureSupplyBase = results['baseline']['nature_supply_percapita'];
  const natureSupplyDelta = deltaTable[scenarioName]['nature_supply_percapita'].value;
  const natureSupplyPercentChange = (natureSupplyDelta / natureSupplyBase) * 100;
  const natureDirection = (natureSupplyDelta >= 0) ? 'increase' : 'decrease';
  const natureBalance = results['baseline']['ntr_bal_avg'];
  const natureBalanceScen = results[scenarioName]['ntr_bal_avg'];
  const natureBalanceDemandMet = (
    (natureBalance + NAT_REQ_PERCAP) / NAT_REQ_PERCAP) * 100;
  const natureBalanceDemandMetScenario = (
    (natureBalanceScen + NAT_REQ_PERCAP) / NAT_REQ_PERCAP) * 100;

  return (
    <ul>
      <li>
        <Icon icon="Flash" />
        <p>
          <span>
            The average daytime high <b>temperature</b> during August is expected to
            <b> {tempDirection} by {Math.abs(temperature).toFixed(METRICS.avg_tmp_v.precision)} &deg;F </b>
            for areas within {COOLING_DISTANCE_STR} of the selected parcels.
          </span>
        </p>
        <p>
          <span>
            This represents an <b>{tempDirection} </b>
            in total cooling costs by
            <b> ${Math.abs(coolingCost).toFixed(METRICS.cdd_cost.precision)}</b>.
          </span>
        </p>
      </li>
      <br />
      <li>
        <Icon icon="tree" />
        <span>
          Carbon storage is expected to
          <b> {carbonDirection} by {Math.abs(carbon).toFixed(METRICS.tot_c_cur.precision)} </b>
          metric tons.
        </span>
      </li>
      <br />
      <li>
        <Icon icon="walk" />
        <span>
          Nature accessibility is expected to
          <b> {natureDirection} by {Math.abs(natureSupplyPercentChange).toFixed(METRICS.nature_supply_percapita.precision)}%. </b>
          within {NATURE_ACCESS_DISTANCE_STR} of the selected parcels.
          In this study area the average person previously had access to {natureBalanceDemandMet.toFixed(METRICS.nature_supply_percapita.precision)}% of
          the natural area that would meet the typical need. Now they have access to {natureBalanceDemandMetScenario.toFixed(METRICS.nature_supply_percapita.precision)}%.
        </span>
      </li>
    </ul>
  );
}

export default function Results(props) {
  const {
    results,
    scenarioDescriptions,
    setSelectedScenario,
  } = props;
  console.log(results)

  const [scenarioName, setScenarioName] = useState(null);
  const [deltaTable, setDeltaTable] = useState(null);
  const [scenarioNames, setScenarioNames] = useState([]);

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
        data[name][metric] = {
          value: results[name][metric] - results['baseline'][metric],
          units: obj.units,
          precision: obj.precision,
          label: obj.label,
        };
      });
    });
    setDeltaTable(data);
    setScenarioNames(names);
    setScenarioName(names.slice(-1)[0]);
  }, [results]);

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
          <span style={{ 'paddingLeft': '2rem' }}>
            the landscape changed:
          </span>
        </h4>
        {
          (scenarioName && deltaTable)
            ? (
              <>
                <LandcoverDescription
                  scenarioDescriptions={scenarioDescriptions}
                  scenarioName={scenarioName}
                />
                <hr />
                <ResultsDescription
                  results={results}
                  deltaTable={deltaTable}
                  scenarioName={scenarioName}
                />
              </>
            )
            : <div />
        }
      </div>
      {
        (scenarioNames.length > 1)
          ? (
            <div>
              <p>
                Each scenario's impact relative to baseline conditions:
              </p>
              <HTMLTable id="results-matrix">
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
                      {Object.values(deltaTable[name]).map((obj) => (
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
