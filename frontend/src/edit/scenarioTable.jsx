import React, { useState, useEffect } from 'react';

import {
  HTMLTable,
  Button,
} from '@blueprintjs/core';

import landuseCodes from '../../../appdata/NLCD_2016.lulcdata.json';

function sqkm(count) {
  if (!parseInt(count)) {
    return '';
  }
  const num = count * 0.030 * 0.030;
  return num.toFixed(2);
}

export default function ScenarioTable(props) {
  const { scenarios } = props;

  const [scenarioTable, setScenarioTable] = useState(null);

  useEffect(async () => {
    const table = {};
    scenarios.forEach((scene) => {
      table[scene.name] = JSON.parse(scene.lulc_stats);
    });
    setScenarioTable(table);
  }, [scenarios]);

  if (!scenarioTable) { return <div />; }

  const scenarioHeader = (
    <tr key="header">
      <td key="0_0" className="table-note">Landcover composition by scenario</td>
      {Object.keys(scenarioTable).map(
        (name) => <td key={name}><div className="header">{name}</div></td>
      )}
    </tr>
  );

  const rows = [];
  rows.push(scenarioHeader);
  let firstRow = true;
  Object.keys(landuseCodes).forEach((code) => {
    const counts = [];
    Object.entries(scenarioTable).forEach(([name, table]) => {
      const count = scenarioTable[name][code] || '';
      counts.push(count);
    });
    if (counts.reduce((x, y) => (x || 0) + (y || 0), 0)) { // skip rows of all 0s
      const cells = [];
      cells.push(
        <td key={code} className="row-name lulc-legend" style={{
          borderLeftColor: landuseCodes[code].color,
        }}
        >
          {landuseCodes[code].name}
        </td>
      );
      cells.push(...counts.map((c, idx) => {
        let content = <span>{sqkm(c)}</span>;
        if (c && firstRow) {
          content = <span>{sqkm(c)} km<sup>2</sup></span>;
        }
        return <td key={idx}>{content}</td>;
      }));
      rows.push(<tr key={code}>{cells}</tr>);
      firstRow = false;
    }
  });

  return (
    <HTMLTable bordered striped id="scenario-table">
      <tbody>
        {rows}
      </tbody>
    </HTMLTable>
  );
}
