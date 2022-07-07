import React, { useState } from 'react';

import {
  Checkbox,
  Radio,
  RadioGroup,
} from '@blueprintjs/core';

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
  const { layers, setVisibility, show, switchBasemap } = props;
  const [basemap, setBasemap] = useState('Streets');
  if (!show) {
    return null;
  }

  const handleChangeBasemap = (event) => {
    const title = event.target.value;
    setBasemap(title); // control the radio button
    switchBasemap(title); // setVisibility on map layers
  };

  const checkboxes = [];
  const radios = [];
  layers.forEach((layer) => {
    if (layer.get('title') === undefined) {
      return;
    }
    if (layer.get('type') === 'base') {
      const title = layer.get('title');
      radios.push(
        <Radio
          key={title}
          label={title}
          value={title}
        />
      );
    } else {
      checkboxes.push(
        <LayerCheckbox
          key={layer.get('title')}
          layer={layer}
          label={layer.get('title')}
          setVisibility={setVisibility}
        />
      );
    }
  });
  return (
    <div className="layers-panel">
      {checkboxes}
      <RadioGroup
        onChange={handleChangeBasemap}
        selectedValue={basemap}
      >
        {radios}
      </RadioGroup>
    </div>
  );
}
