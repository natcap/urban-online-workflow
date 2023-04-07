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
  const {
    layers,
    setVisibility,
    show,
    switchBasemap,
    switchScenario,
    basemap,
  } = props;

  // Basemap Radio is controlled by Map, where we hardcode the
  // default basemap to display. No scenario layers are displayed
  // by default, so that Radio can be controlled here.
  const [selectedScenario, setSelectedScenario] = useState(null);

  if (!show) {
    return null;
  }

  const handleChangeBasemap = (event) => {
    const title = event.target.value;
    switchBasemap(title);
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
  layers.forEach((layer) => {
    if (layer.get('group') === 'scenarios') {
      scenarioLayerGroup = layer;
      layer.getLayers().forEach(lyr => {
        const title = lyr.get('title');
        scenarios.push(
          <Radio
            key={title}
            label={title}
            value={title}
          />
        );
      });
    } else {
      if (layer.get('title') === undefined) {
        return;
      }
      if (layer.get('type') === 'base') {
        const title = layer.get('title');
        basemaps.push(
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
    }
  });

  return (
    <div className="layers-panel">
      {checkboxes}
      <RadioGroup
        label="Basemaps:"
        onChange={handleChangeBasemap}
        selectedValue={basemap}
      >
        {basemaps}
      </RadioGroup>
      {
        (scenarios.length)
          ? (
            <>
              <LayerCheckbox
                key="scenario-group"
                layer={scenarioLayerGroup}
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
