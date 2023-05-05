import React, { useState } from 'react';

import {
  Button,
  ProgressBar,
} from '@blueprintjs/core';

export default function Results(props) {
  const { results } = props;
  return (
    <div>
      {JSON.stringify(results)}
    </div>
  );
}
