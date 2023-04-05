import React from 'react';

import {
  HTMLSelect,
  FormGroup,
} from '@blueprintjs/core';

export default function SelectStudyArea(props) {
  const {
    studyAreaID,
    savedStudyAreas,
    switchStudyArea
  } = props;

  const optionArray = savedStudyAreas.map(
    (area) => <option key={area.id} value={area.id}>{area.name}</option>
  );
  optionArray.push(<option key="new" value="new">Create new study area</option>);

  return (
    <FormGroup
      inline
      label="Select a study area"
      labelFor="select-study-area"
    >
      <HTMLSelect
        id="select-study-area"
        value={studyAreaID}
        onChange={(event) => switchStudyArea(event.target.value)}
      >
        {optionArray}
      </HTMLSelect>
    </FormGroup>
  );
}
