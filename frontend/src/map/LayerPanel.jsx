import React, { useState, useEffect } from 'react';

import {
  Checkbox,
  Radio,
  RadioGroup,
} from '@blueprintjs/core';


function LayerCheckbox(props) {
  const { label, setVisibility } = props;
  const [checked, setChecked] = useState(true);

  const handleChange = (event) => {
    setChecked(event.target.checked);
    // setVisibility(layer, event.target.checked);
    setVisibility(label, event.target.checked);
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
  const {
    layers,
    setVisibility,
    show,
    switchBasemap,
    switchScenario,
  } = props;
  console.log(layers)

  const [selectedScenario, setSelectedScenario] = useState(null);
  const [selectedBasemap, setSelectedBasemap] = useState(null);

  useEffect(() => {
    console.log(layers)
    layers.forEach(([type, title, isVisible]) => {
      if (type === 'base') {
        if (isVisible) {
          setSelectedBasemap(title);
        }
      } else if (type === 'scenario') {
        if (isVisible) {
          setSelectedScenario(title);
        }
      }
    });
  }, [layers]);

  if (!show) {
    return null;
  }

  const handleChangeBasemap = (event) => {
    const title = event.target.value;
    switchBasemap(title);
    setSelectedBasemap(title);
  };

  const handleChangeScenario = (event) => {
    const title = event.target.value;
    switchScenario(title);
    setSelectedScenario(title);
  };

  const checkboxes = [];
  const basemaps = [];
  const scenarios = [];
  let scenarioLayerGroup;
  layers.forEach(([type, title, isVisible]) => {
    if (!title) {
      return;
    }
    if (type === 'scenario') {
      scenarios.push(
        <Radio
          key={title}
          label={title}
          value={title}
        />
      );
    } else if (type === 'base') {
      basemaps.push(
        <Radio
          key={title}
          label={title}
          value={title}
        />
      );
    } else if (type !== 'group') {
      checkboxes.push(
        <LayerCheckbox
          key={title}
          // layer={layer}
          label={title}
          setVisibility={setVisibility}
        />
      );
    }
  });
  console.log(scenarios)
  return (
    <div className="layers-panel">
      {checkboxes}
      <RadioGroup
        label="Basemaps:"
        onChange={handleChangeBasemap}
        selectedValue={selectedBasemap}
      >
        {basemaps}
      </RadioGroup>
      {
        (scenarios.length)
          ? (
            <>
              <LayerCheckbox
                key="scenario-group"
                // layer={layer}
                label="Scenarios:"
                setVisibility={setVisibility}
              />
              <RadioGroup
                onChange={handleChangeScenario}
                selectedValue={selectedScenario}
              >
                {scenarios}
              </RadioGroup>
            </>
          )
          : <div />
      }
    </div>
  );
}
