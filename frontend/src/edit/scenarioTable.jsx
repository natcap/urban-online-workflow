import React, { useState, useEffect } from 'react';

import {
  HTMLSelect,
  HTMLTable,
  Button,
} from '@blueprintjs/core';

import { toAcres } from '../utils';
import nlcdLookup from '../../../appdata/nlcd_colormap.json';
import nludLookup from '../../../appdata/nlud_colormap.json';
import treeLookup from '../../../appdata/tree_colormap.json';

const LULC_LOOKUP = {
  nlcd: nlcdLookup,
  nlud: nludLookup,
  tree: treeLookup,
};

const LULC_TYPES = {
  'nlcd': 'landcover',
  'nlud': 'landuse',
  'tree': 'tree cover'
};

export default function ScenarioTable(props) {
  const { scenarios } = props;

  const [scenarioTable, setScenarioTable] = useState(null);
  const [landcoverTypes, setLandcoverTypes] = useState([]);
  const [landuseTypes, setLanduseTypes] = useState([]);
  const [treeTypes, setTreeTypes] = useState([]);
  const [lulcType, setLulcType] = useState('nlcd');

  useEffect(() => {
    const landcover = [];
    const landuse = [];
    const tree = [];
    (async () => {
      const table = {};
      scenarios.forEach((scene) => {
        table[scene.name] = JSON.parse(scene.lulc_stats);
      });
      setScenarioTable(table);
      Object.values(table).forEach((obj) => {
        landcover.push(...Object.keys(obj['nlcd']));
        landuse.push(...Object.keys(obj['nlud']));
        tree.push(...Object.keys(obj['tree']));
      });
      setLandcoverTypes(new Set(landcover));
      setLanduseTypes(new Set(landuse));
      setTreeTypes(new Set(tree));
    })();
  }, [scenarios]);

  if (!scenarioTable) { return <div />; }

  const scenarioHeader = (
    <tr key="header">
      <td key="0_0">
        <HTMLSelect
          onChange={(event) => setLulcType(event.target.value)}
          value={lulcType}
        >
          {Object.entries(LULC_TYPES).map(
            ([type, label]) => <option key={type} value={type}>{label}</option>
          )}
        </HTMLSelect>
      </td>
      {Object.keys(scenarioTable).map(
        (name) => <td key={name}><div className="header">{name}</div></td>
      )}
    </tr>
  );

  const rows = [];
  rows.push(scenarioHeader);

  let codes;
  switch (lulcType) {
    case 'nlcd':
      codes = landcoverTypes;
      break;
    case 'nlud':
      codes = landuseTypes;
      break;
    case 'tree':
      codes = treeTypes;
      break;
    default:
      codes = [];
  }
  codes.forEach((code) => {
    const counts = [];
    Object.entries(scenarioTable).forEach(([x, table]) => {
      const count = table[lulcType][code] || '';
      counts.push(count);
    });
    if (counts.reduce((x, y) => (x || 0) + (y || 0), 0)) { // skip rows of all 0s
      const cells = [];
      cells.push(
        <td
          key={code}
          className="row-name lulc-legend"
          style={{
            borderLeftColor: LULC_LOOKUP[lulcType][code].color,
          }}
        >
          {LULC_LOOKUP[lulcType][code].name}
        </td>
      );
      cells.push(...counts.map((c, idx) => {
        let content = '';
        if (c) {
          content = <span>{toAcres(c)} acres</span>;
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
