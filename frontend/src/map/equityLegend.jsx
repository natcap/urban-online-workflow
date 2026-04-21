import React from 'react';

import {
  HTMLTable,
} from '@blueprintjs/core';

import COLORMAP from './equity_colormap.json';

const LABELS = {
  'Heat-Income Equity': 'Income',
  'Heat-Race Equity': '% BIPOC',
};

const bipocMatrix = [
  ['hotter', 2, 12, 22],
  ['', 1, 11, 21],
  ['cooler', 0, 10, 20],
  ['', 'less', '', 'more'],
];

const incomeMatrix = [
  ['hotter', 22, 12, 2],
  ['', 21, 11, 1],
  ['cooler', 20, 10, 0],
  ['', 'lower', '', 'higher'],
];

const MATRICES = {
  'Heat-Income Equity': incomeMatrix,
  'Heat-Race Equity': bipocMatrix,
};

export default function EquityLegend(props) {
  const {
    show,
    equityLayerTitle,
  } = props;

  if (show && equityLayerTitle) {
    const colorBlocks = [];
    MATRICES[equityLayerTitle].forEach((row) => {
      const blocks = [];
      row.forEach((idx) => {
        if (typeof idx === 'number') {
          const color = COLORMAP[idx];
          blocks.push(
            <td>
              <div
                style={{
                  backgroundColor: color,
                  width: '40px',
                  height: '40px',
                }}
              />
            </td>,
          );
        } else {
          blocks.push(<td>{idx}</td>);
        }
      });
      colorBlocks.push(<tr>{blocks}</tr>);
    });

    return (
      <div className="equity-legend">
        <span className="title">{equityLayerTitle}</span>
        <HTMLTable compact>
          <tbody>
            {colorBlocks}
          </tbody>
        </HTMLTable>
        <span className="axis-title">{LABELS[equityLayerTitle]}</span>
      </div>
    );
  }
  return <div />;
}
