import React, { useState } from 'react';

import { Checkbox } from '@blueprintjs/core';

function LayerCheckbox(props) {
  const { layer, label, setVisibility } = props;
  const [checked, setChecked] = useState(true);

  const handleChange = (event) => {
    setChecked(event.target.checked);
    setVisibility(layer, event.target.checked);
  };

  return (
    <Checkbox
      checked={checked}
      label={label}
      onChange={handleChange}
    />
  );
}

export default function LayerPanel(props) {
  const { layers, setVisibility, show } = props;
  console.log(show)
  if (!show) {
    return null;
  }
  const checkboxes = [];
  layers.forEach((layer) => {
    checkboxes.push(
      <li key={layer.get('title')}>
        <LayerCheckbox
          layer={layer}
          label={layer.get('title')}
          setVisibility={setVisibility}
        />
      </li>
    );
  });
  return (
    <div>
      <ul className="layers-checklist">
        {checkboxes}
      </ul>
    </div>
  );
}
