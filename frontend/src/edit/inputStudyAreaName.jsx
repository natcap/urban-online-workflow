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

  return (
    <div>
      <InputGroup
        placeholder={name}
        value={studyAreaName}
        onChange={(event) => setStudyAreaName(event.currentTarget.value)}
        rightElement={(
          <Button
            onClick={() => nameStudyArea(studyAreaName)}
          >
            Rename
          </Button>
        )}
      />
    </div>
  );
}
