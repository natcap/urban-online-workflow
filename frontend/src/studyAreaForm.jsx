import React, { useState } from 'react';

import {
  InputGroup,
  Button,
  HTMLTable,
} from '@blueprintjs/core';

import landuseCodes from './landuseCodes';

export default function StudyAreaForm(props) {
  const {
    submitStudyArea,
    parcelSet,
    removeParcel,
    immutableStudyArea,
  } = props;
  const [studyAreaName, setStudyAreaName] = useState('');
  const [highlightedCode, setHighlightedCode] = useState(null);

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
  Object.entries(parcelSet).forEach(([id, data]) => {
    rows.push(
      <tr key={id}>
        {
          (!immutableStudyArea) // study area not yet submitted; allow changes
            ? (
              <td>
                <Button
                  icon="remove"
                  onClick={() => removeParcel(id)}
                />
              </td>
            )
            : null
        }
        <td>{id}</td>
        <td><div className="parcel-block">{plot(data.table)}</div></td>
      </tr>,
    );
  });

  return (
    <div>
      <p className="sidebar-subheading">
        <span>Parcels in study area </span>
        {/*<em>{studyArea}</em>*/}
      </p>
      {
        (!immutableStudyArea)
          ? (
            <InputGroup
              placeholder="name this study area"
              value={studyAreaName}
              onChange={(event) => setStudyAreaName(event.currentTarget.value)}
              rightElement={(
                <Button
                  onClick={() => submitStudyArea(studyAreaName)}
                >
                  Save
                </Button>
              )}
            />
          )
          : <div />
      }
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
