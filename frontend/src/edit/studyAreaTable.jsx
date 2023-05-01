import React, { useState } from 'react';

import {
  Button,
  HTMLTable,
} from '@blueprintjs/core';

import { removeParcel } from '../requests';
import landuseCodes from '../../../appdata/NLCD_2016.lulcdata.json';

export default function StudyAreaTable(props) {
  const {
    parcelArray,
    refreshStudyArea,
    studyAreaID,
    immutableStudyArea,
  } = props;
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
    rows.push(
      <tr
        className={hiddenRowClass}
        key={parcel.parcel_id}
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
