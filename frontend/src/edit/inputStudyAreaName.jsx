import React, { useState, useEffect } from 'react';

import {
  InputGroup,
  Button,
} from '@blueprintjs/core';

export default function InputStudyAreaName(props) {
  const {
    nameStudyArea,
    name,
  } = props;
  const [studyAreaName, setStudyAreaName] = useState('');

  useEffect(() => {
    setStudyAreaName(name);
  }, [name]);

  const handleSubmit = (event) => {
    event.preventDefault();
    nameStudyArea(studyAreaName);
  };

  return (
    <form onSubmit={handleSubmit}>
      <InputGroup
        placeholder={name}
        value={studyAreaName}
        onChange={(event) => setStudyAreaName(event.currentTarget.value)}
        rightElement={(
          <Button
            onClick={handleSubmit}
          >
            Rename
          </Button>
        )}
      />
    </form>
  );
}
