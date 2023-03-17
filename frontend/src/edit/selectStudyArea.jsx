import React, { useState, useEffect } from 'react';

import {
  HTMLSelect,
  FormGroup,
} from '@blueprintjs/core';

export default function SelectStudyArea(props) {
  const {
    savedStudyAreas,
    switchStudyArea
  } = props;
  console.log(savedStudyAreas);

  const optionArray = savedStudyAreas.map(
    (area) => <option key={area.id} value={area.id}>{area.name}</option>
  );
  optionArray.push(<option key="new" value={undefined}>Create new study area</option>);

  return (
    <FormGroup
      inline
      label="Select a study area"
      labelFor="select-study-area"
    >
      <HTMLSelect
        id="select-study-area"
        onChange={(event) => switchStudyArea(event.target.value)}
      >
        {optionArray}
      </HTMLSelect>
    </FormGroup>
  );
}
