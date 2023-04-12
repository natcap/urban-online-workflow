import React, { useState, useEffect } from 'react';

import {
  Checkbox,
  Radio,
  RadioGroup,
} from '@blueprintjs/core';

function LayerCheckbox(props) {
  const { label, setVisibility, className } = props;
  const [checked, setChecked] = useState(true);

  const handleChange = (event) => {
    setChecked(event.target.checked);
    setVisibility(label, event.target.checked);
  };

  return (
    <Checkbox
      className={className}
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

  const [selectedScenario, setSelectedScenario] = useState(null);
  const [selectedBasemap, setSelectedBasemap] = useState(null);

  useEffect(() => {
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
  let scenarioGroupCheckbox;
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
    } else if (type === 'scenario-group') {
      scenarioGroupCheckbox = (
        <LayerCheckbox
          className="subheader"
          key={title}
          label={title}
          setVisibility={setVisibility}
        />
      );
    } else {
      checkboxes.push(
        <LayerCheckbox
          key={title}
          label={title}
          setVisibility={setVisibility}
        />
      );
    }
  });

  return (
    <div className="layers-panel">
      {checkboxes}
      <p
        htmlFor="basemaps-group"
        className="subheader"
      >
        Basemaps:
      </p>
      <RadioGroup
        id="basemaps-group"
        onChange={handleChangeBasemap}
        selectedValue={selectedBasemap}
      >
        {basemaps}
      </RadioGroup>
      {
        (scenarios.length)
          ? (
            <>
              {scenarioGroupCheckbox}
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
