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
    units: {
      [`${'\u00b0'}F`]: (x) => x,
    },
    precision: 2,
  },
  cdd_cost: {
    label: 'change in cooling cost',
    units: {
      USD: (x) => x,
    },
    precision: 0,
  },
  tot_c_cur: {
    label: 'change in carbon stored',
    units: {
      'metric tons': (x) => x,
    },
    precision: 0,
  },
  nature_supply_percapita: {
    label: 'change in supply of nature per person',
    units: {
      'square meters': (x) => x,
      'hectares': (x) => x * 1e-4,
      'square feet': (x) => x * 10.764,
      'acres': (x) => x / 4016.856,
    },
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
      <tbody>
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
      </tbody>
    </HTMLTable>
  );
}

function ResultsDescription(props) {
  const {
    results,
    deltaTable,
    scenarioName,
  } = props;

  const temperature = deltaTable[scenarioName]['avg_tmp_v'];
  const coolingCost = deltaTable[scenarioName]['cdd_cost'];
  const tempDirection = (temperature >= 0) ? 'increase' : 'decrease';

  const carbon = deltaTable[scenarioName]['tot_c_cur'];
  const carbonDirection = (carbon >= 0) ? 'increase' : 'decrease';

  const natureSupplyBase = results['baseline']['nature_supply_percapita'];
  const natureSupplyDelta = deltaTable[scenarioName]['nature_supply_percapita'];
  let natureSupplyChange;
  if (natureSupplyBase === 0) {
    natureSupplyChange = `${Math.abs(natureSupplyDelta).toFixed(
      METRICS.nature_supply_percapita.precision
    )} square meters`;
  } else {
    natureSupplyChange = `${Math.abs((
      natureSupplyDelta / natureSupplyBase) * 100).toFixed(
      METRICS.nature_supply_percapita.precision
    )}%`;
  }
  const natureDirection = (natureSupplyDelta >= 0) ? 'increase' : 'decrease';
  const natureBalance = results['baseline']['ntr_bal_avg'];
  const natureBalanceScen = results[scenarioName]['ntr_bal_avg'];
  const natureBalanceDemandMet = (
    ((natureBalance + NAT_REQ_PERCAP) / NAT_REQ_PERCAP) * 100
  ).toFixed(METRICS.nature_supply_percapita.precision) + 0;
  const natureBalanceDemandMetScenario = (
    ((natureBalanceScen + NAT_REQ_PERCAP) / NAT_REQ_PERCAP) * 100
  ).toFixed(METRICS.nature_supply_percapita.precision);

  return (
    <ul>
      <li>
        <Icon icon="flash" />
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
          <b> {natureDirection} by {natureSupplyChange}. </b>
          within {NATURE_ACCESS_DISTANCE_STR} of the selected parcels.
          In this area the average person previously had access to {natureBalanceDemandMet}% of
          the natural area that would meet the typical need. Now they have access to {natureBalanceDemandMetScenario}%.
        </span>
      </li>
    </ul>
  );
}

function ResultsTable(props) {
  const {
    deltaTable,
    scenarioNames,
  } = props;

  const [metricLookup, setMetricLookup] = useState(null);

  useEffect(() => {
    const data = {};
    Object.keys(METRICS).forEach((metric) => {
      data[metric] = {
        unit: Object.keys(METRICS[metric].units)[0],
        func: Object.values(METRICS[metric].units)[0],
      };
    });
    setMetricLookup(data);
  }, []);

  const setUnit = (unit, metric) => {
    const lookup = { ...metricLookup };
    lookup[metric].unit = unit;
    lookup[metric].func = METRICS[metric].units[unit];
    setMetricLookup(lookup);
  };

  if (metricLookup) {
    return (
      <HTMLTable>
        <tbody>
          <tr key="header">
            <th key="blank" />
            {Object.entries(METRICS).map(([metric, obj]) => (
              <th key={obj.label}>
                {obj.label}
                <br />
                {(Object.keys(obj.units).length > 1)
                  ? (
                    <HTMLSelect
                      value={metricLookup[metric].unit}
                      onChange={(e) => setUnit(e.target.value, metric)}
                    >
                      {Object.keys(obj.units).map(
                        (unit) => <option key={unit} value={unit}>{unit}</option>
                      )}
                    </HTMLSelect>
                  )
                  : <span className="units">({Object.keys(obj.units)[0]})</span>}
              </th>
            ))}
          </tr>
          {scenarioNames.map((name) => (
            <tr key={name}>
              <th>{name}</th>
              {Object.keys(metricLookup).map((metric) => {
                const value = metricLookup[metric]['func'](
                  deltaTable[name][metric],
                ).toFixed(METRICS[metric].precision);
                return (
                  <td className="table-value" key={metric}>
                    {(value > 0) ? `+${value}` : value}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </HTMLTable>
    );
  }
}

export default function Results(props) {
  const {
    results,
    scenarioDescriptions,
    setSelectedScenario,
  } = props;

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
      Object.keys(METRICS).forEach((metric) => {
        data[name][metric] = results[name][metric] - results['baseline'][metric];
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
              <ResultsTable
                id="results-matrix"
                deltaTable={deltaTable}
                scenarioNames={scenarioNames}
              />
            </div>
          ) : <div />
      }
      <ResultsDemographics
        census={results.baseline.census}
      />
    </div>
  );
}
