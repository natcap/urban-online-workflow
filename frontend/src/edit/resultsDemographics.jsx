import React from 'react';

import {
  HTMLTable,
  Icon,
} from '@blueprintjs/core';

const HOUSE_SNAP = 'Household received Food Stamps or SNAP in the past 12 months';
const HOUSE_NO_SNAP = 'Household did not receive Food Stamps or SNAP in the past 12 months';
const INCOME_BELOW = 'Income in the past 12 months below poverty level';
const INCOME_ABOVE = 'Income in the past 12 months at or above poverty level';

export default function ResultsDemographics(props) {
  const { census } = props;
  let populationTable;
  let povertyPar;
  if (census && census.race) {
    const populations = Object.entries(census.race)
      .sort(([, a], [, b]) => b - a);

    populationTable = (
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
    );
  }

  if (census && census.poverty) {
    povertyPar = (
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
  }

  return (
    <div>
      <h2 id="demographics-header">
        <Icon icon="people" size="30"/>
        Demographics of the area influenced by the change:
      </h2>
      <div id="demographics-body">
        {populationTable}
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
