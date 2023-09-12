import React, { useState } from 'react';

import {
  Button,
  HTMLTable,
} from '@blueprintjs/core';

import { removeParcel } from '../requests';
// import landuseCodes from '../../../appdata/NLCD_2016.lulcdata.json';

export default function StudyAreaTable(props) {
  const {
    parcelArray,
    refreshStudyArea,
    studyAreaID,
    immutableStudyArea,
    setHoveredParcel,
  } = props;
  console.log(parcelArray)
  const [highlightedCode, setHighlightedCode] = useState(null);
  const [hiddenRowClass, setHiddenRowClass] = useState('');

  const deleteParcel = async (parcelID) => {
    await removeParcel(parcelID, studyAreaID);
    refreshStudyArea();
  };

  const toggleRows = () => {
    if (hiddenRowClass) {
      setHiddenRowClass('');
    } else {
      setHiddenRowClass('hidden-row');
    }
  };

  function plot(table) {
    const sorted = Object.entries(table)
      .sort(([, a], [, b]) => b - a);
    const sortedClasses = sorted.map((x) => x[0]);
    const sortedValues = sorted.map((x) => x[1]);
    const total = sortedValues.reduce((partial, a) => partial + a, 0);
    let x = 0;
    let i = 0;
    while (x < total / 2) {
      x += sortedValues[i];
      i++;
    }
    const topClasses = sortedClasses.slice(0, i);
    const divs = topClasses.map((x, i) => {
      const pct = (sortedValues[i] / total) * 100;
      return <div>{x}: {pct}</div>;
    });
    return divs;
  }

  const rows = [];
  rows.push(
    <tr key="header">
      <td>
        <Button
          icon={hiddenRowClass ? 'Maximize' : 'Minimize'}
          onClick={toggleRows}
        />
      </td>
      <td className="parcel-address"><em>address</em></td>
      <td><em>landuse composition</em></td>
    </tr>,
  );
  parcelArray.forEach((parcel) => {
    const lulcData = JSON.parse(parcel.parcel_stats.lulc_stats);
    rows.push(
      <tr
        className={hiddenRowClass}
        key={parcel.parcel_id}
        onMouseOver={() => setHoveredParcel(parcel.parcel_id)}
        onFocus={() => setHoveredParcel(parcel.parcel_id)}
        onMouseOut={() => setHoveredParcel(null)}
        onBlur={() => setHoveredParcel(null)}
      >
        <td>
          <Button
            icon="remove"
            onClick={() => deleteParcel(parcel.parcel_id)}
            disabled={immutableStudyArea}
          />
        </td>
        <td className="parcel-address">{parcel.address}</td>
        <td>
          {
            (lulcData)
              ? (
                <div className="parcel-block lulc-legend">
                  {plot(lulcData)}
                </div>
              )
              : <div />
          }
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
      <div className="study-area-table-legend">
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
