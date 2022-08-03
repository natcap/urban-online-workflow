import React, { useState } from 'react';

import {
  Drawer,
  Label,
  Button,
  Switch,
  FormGroup,
  InputGroup,
  HTMLSelect
} from '@blueprintjs/core';

export default function WallpaperingMenu(props) {
  const {
    patternSamplingMode,
    togglePatternSamplingMode,
    newPatternName,
    setNewPatternName,
    selectedPattern,
    setSelectedPattern,
    handleSamplePattern,
    patterns,
  } = props;
  const [drawerIsOpen, setDrawerIsOpen] = useState(false);

  return (
    <>
      <div className="edit-wallpaper">
        <Label htmlFor="pattern-select">
          Choose an existing pattern:
        </Label>
        <Button
          onClick={() => setDrawerIsOpen(true)}
        >
          Show
        </Button>
        <PatternCatalogDrawer
          isOpen={drawerIsOpen}
          closeDrawer={() => setDrawerIsOpen(false)}
          setSelectedPattern={setSelectedPattern}
          patternSamplingMode={patternSamplingMode}
          selectedPattern={selectedPattern}
          patterns={patterns}
        />
      </div>
      <Switch
        checked={patternSamplingMode}
        labelElement={<strong>Create new pattern</strong>}
        onChange={togglePatternSamplingMode}
      />
      {(patternSamplingMode)
        ? (
          <>
            <p>1. Drag the box over the map to sample a pattern</p>
            <p>2. Name the new pattern:</p>
            <FormGroup>
              <InputGroup
                id="text-input"
                placeholder="Placeholder text"
                value={newPatternName}
                onChange={(event) => setNewPatternName(event.target.value)}
              />
            </FormGroup>
            <Button
              icon="camera"
              text="Sample this pattern"
              onClick={handleSamplePattern}
            />
          </>
        )
        : <div />}
    </>
  );
}

function PatternCatalogDrawer(props) {
  const {
    isOpen,
    closeDrawer,
    setSelectedPattern,
    patternSamplingMode,
    selectedPattern,
    patterns,
  } = props;

  console.log(patterns)
  const patternList = [];
  patterns.forEach((pattern) => {
    const { pattern_id, label, url } = pattern;
    patternList.push(
      <li>
        <Button
          onClick={() => console.log(pattern_id)}
        >
          <img className="thumbnail" src={url} alt={label} />
        </Button>
        <Label>
          {label}
        </Label>
      </li>
    );
  });

  return (
    <Drawer
      isOpen={isOpen}
      onClose={closeDrawer}
      title="Wallpaper pattern catalog"
    >
      <ul className="pattern-catalog">
        {patternList}
      </ul>
    </Drawer>
  );
}
