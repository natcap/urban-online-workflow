import React, { useState } from 'react';

import {
  Button,
  HTMLTable,
} from '@blueprintjs/core';

import { removeParcel } from '../requests';
import landuseCodes from '../landuseCodes';

export default function StudyAreaTable(props) {
  const {
    parcelSet,
    refreshStudyArea,
  } = props;
  console.log(parcelSet)
  const [highlightedCode, setHighlightedCode] = useState(null);

  const deleteParcel = async (id) => {
    await removeParcel(id);
    refreshStudyArea();
  };

  function plot(table) {
    const blocks = [];
    Object.entries(table).forEach(([code, count]) => {
      let n = 0;
      while (n < count) {
        blocks.push(
          <div
            key={`${n}${code}`}
            style={{
              backgroundColor: landuseCodes[code].color,
              width: '10px',
              height: '10px',
            }}
            onMouseOver={() => setHighlightedCode(code)}
            onMouseOut={() => setHighlightedCode(null)}
          />,
        );
        n++;
      }
    });
    return blocks;
  }

  const rows = [];
  rows.push(
    <tr>
      <td />
      <td><em>address</em></td>
      <td><em>landuse composition</em></td>
    </tr>,
  );
  parcelSet.forEach((parcel) => {
    rows.push(
      <tr key={parcel.id}>
        <td>
          <Button
            icon="remove"
            onClick={() => deleteParcel(parcel.id)}
          />
        </td>
        <td>{parcel.id}</td>
        <td>
          <div className="parcel-block">
            {plot(JSON.parse(parcel.parcel_stats.lulc_stats).base)}
          </div>
        </td>
      </tr>,
    );
  });

  return (
    <div>
      <HTMLTable
        className="study-area-table bp4-html-table-condensed"
      >
        <tbody>
          {rows}
        </tbody>
      </HTMLTable>
      <div className="study-area-legend">
        {
          (highlightedCode)
            ? (
              <>
                <div
                  style={{
                    backgroundColor: landuseCodes[highlightedCode].color,
                    width: '20px',
                    height: '20px',
                    display: 'inline-block',
                    marginRight: '0.5em'
                  }}
                />
                <span>{landuseCodes[highlightedCode].name}</span>
              </>
            )
            : <div />
        }
      </div>
    </div>
  );
}