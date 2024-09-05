import React from 'react';

import {
  HTMLTable,
} from '@blueprintjs/core';

import colormap from '../../../appdata/equity_colormap.json';

const LABELS = {
  'Heat-Income Equity': 'Income',
  'Heat-Race Equity': '% Black, Indigenous, and People of Color',
};

export default function EquityLegend(props) {
  const {
    show,
    equityLayerTitle,
  } = props;

  const matrix = [
    ['hotter', 2, 12, 22],
    ['', 1, 11, 21],
    ['cooler', 0, 10, 20],
    ['', 'less', '', 'more'],
  ];

  const colorBlocks = [];
  matrix.forEach((row) => {
    const blocks = [];
    row.forEach((idx) => {
      if (typeof idx === 'number') {
        const color = colormap[idx];
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

  if (show) {
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
