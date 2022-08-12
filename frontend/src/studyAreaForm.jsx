import React, { useState } from 'react';

import {
  InputGroup,
  Button,
  HTMLTable,
} from '@blueprintjs/core';

export default function StudyAreaForm(props) {
  const {
    submitStudyArea,
    parcelSet,
    removeParcel,
    studyArea,
  } = props;
  const [studyAreaName, setStudyAreaName] = useState('');

  const rows = [];
  Object.entries(parcelSet).forEach(([id, data]) => {
    rows.push(
      <tr key={id}>
        {
          (!studyArea) // study area not yet submitted; allow changes
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
        <td>{JSON.stringify(data.table)}</td>
      </tr>,
    );
  });

  return (
    <div>
      <p className="sidebar-subheading">
        {`Parcels in study area ${studyArea}:`}
      </p>
      <HTMLTable bordered striped className="scenario-table">
        <tbody>
          {rows}
        </tbody>
      </HTMLTable>
      {
        (!studyArea)
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
    </div>
  );
}
