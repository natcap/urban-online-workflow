import React, { useState, useEffect } from 'react';

import {
  Checkbox,
  Radio,
  RadioGroup,
} from '@blueprintjs/core';

function LayerCheckbox(props) {
  const {
    label,
    className,
    checked,
    toggle
  } = props;

  return (
    <Checkbox
      className={className}
      checked={checked}
      label={label}
      onChange={toggle}
    />
  );
}

export default function LayerPanel(props) {
  const {
    layers,
    setVisibility,
    show,
    switchBasemap,
    switchEnviro,
    switchScenario,
    selectedScenario,
  } = props;

  const [scenario, setScenario] = useState(null);
  const [enviro, setEnviro] = useState(null);
  const [basemap, setBasemap] = useState(null);

  useEffect(() => {
    layers.forEach(([type, title, isVisible]) => {
      if (type === 'base') {
        if (isVisible) {
          setBasemap(title);
        }
      }
      if (type === 'enviro') {
        if (isVisible) {
          setEnviro(title);
        }
      } else if (type === 'scenario') {
        if (isVisible) {
          setScenario(title);
        }
      }
    });
  }, [layers]);

  useEffect(() => {
    if (selectedScenario) { setScenario(selectedScenario); }
  }, [selectedScenario]);

  if (!show) {
    return null;
  }

  const handleChangeBasemap = (event) => {
    const title = event.target.value;
    switchBasemap(title);
    setBasemap(title);
  };

  const handleChangeEnviro = (event) => {
    const title = event.target.value;
    console.log(title)
    switchEnviro(title);
    setEnviro(title);
  };

  const handleChangeScenario = (event) => {
    const title = event.target.value;
    switchScenario(title);
    setScenario(title);
  };

  const checkboxes = [];
  const basemaps = [];
  const enviros = [];
  const scenarios = [];
  let enviroGroupCheckbox;
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
    } else if (type === 'enviro') {
      enviros.push(
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
          checked={isVisible}
          toggle={() => setVisibility(title, !isVisible)}
        />
      );
    } else if (type === 'enviro-group') {
      enviroGroupCheckbox = (
        <LayerCheckbox
          className="subheader"
          key={title}
          label={title}
          checked={isVisible}
          toggle={() => setVisibility(title, !isVisible)}
        />
      );
    } else {
      checkboxes.push(
        <LayerCheckbox
          key={title}
          label={title}
          checked={isVisible}
          toggle={() => setVisibility(title, !isVisible)}
        />
      );
    }
  });

  return (
    <div className="layers-panel">
      {checkboxes}
      {
        (scenarios.length)
          ? (
            <>
              {scenarioGroupCheckbox}
              <RadioGroup
                onChange={handleChangeScenario}
                selectedValue={scenario}
              >
                {scenarios}
              </RadioGroup>
            </>
          )
          : <div />
      }
      {enviroGroupCheckbox}
      <RadioGroup
        onChange={handleChangeEnviro}
        selectedValue={enviro}
      >
        {enviros}
      </RadioGroup>
      <p
        htmlFor="basemaps-group"
        className="subheader"
      >
        Basemaps:
      </p>
      <RadioGroup
        id="basemaps-group"
        onChange={handleChangeBasemap}
        selectedValue={basemap}
      >
        {basemaps}
      </RadioGroup>
    </div>
  );
}
