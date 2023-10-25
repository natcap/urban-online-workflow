import React, { useState, useEffect } from 'react';

import {
  HTMLTable,
  Button,
} from '@blueprintjs/core';

import landuseCodes from '../../../appdata/overlay_simple_crosswalk.json';

function acres(count) {
  if (!parseInt(count)) {
    return '';
  }
  const acres = (count * 30 * 30) / 4047; // square-meters to acres
  return acres.toFixed(1);
}

function sortLulcStats(stats_map_string) {
  let lulcData = JSON.parse(stats_map_string);
  if (!lulcData) {
    lulcData = {};
  }
  const sorted = Object.entries(lulcData)
    .sort(([, a], [, b]) => b - a);
  const sortedClasses = sorted.map((x) => x[0]);
  const sortedValues = sorted.map((x) => x[1]);
  return [sortedClasses, sortedValues];
}

export default function ScenarioTable(props) {
  const { scenarios } = props;

  const [scenarioTable, setScenarioTable] = useState(null);

  useEffect(() => {
    (async () => {
      const table = {};
      scenarios.forEach((scene) => {
        table[scene.name] = JSON.parse(scene.lulc_stats);
      });
      setScenarioTable(table);
      console.log(table)
    })();
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
          // borderLeftColor: landuseCodes[code].color,
        }}
        >
          {landuseCodes[code]['name']}
        </td>
      );
      cells.push(...counts.map((c, idx) => {
        let content = '';
        if (c) {
          content = <span>{acres(c)} acres</span>;
        }
        return <td key={idx}>{content}</td>;
      }));
      rows.push(<tr key={code}>{cells}</tr>);
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
