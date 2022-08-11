import React, { useState, useEffect } from 'react';

import {
  Drawer,
  Label,
  Button,
  Switch,
  FormGroup,
  InputGroup,
  NonIdealState,
  NonIdealStateIconSize,
} from '@blueprintjs/core';

import {
  getPatterns,
  createPattern,
} from './requests';

export default function WallpaperingMenu(props) {
  const {
    sessionID,
    patternSampleWKT,
    patternSamplingMode,
    togglePatternSamplingMode,
    selectedPattern,
    setSelectedPattern,
  } = props;

  const [drawerIsOpen, setDrawerIsOpen] = useState(false);
  const [patterns, setPatterns] = useState([]);
  const [newPatternName, setNewPatternName] = useState('New Pattern 1');

  useEffect(async () => {
    setPatterns(await getPatterns() || []);
  }, []);

  const handleSamplePattern = async (event) => {
    event.preventDefault();
    await createPattern(patternSampleWKT, newPatternName, sessionID);
    setPatterns(await getPatterns());
    setSelectedPattern(
      patterns.filter((pattern) => pattern.label === newPatternName)
    );
    togglePatternSamplingMode();
  };

  console.log(selectedPattern)
  return (
    <>
      <div className="wallpaper-options">
        <div>
          <Button
            onClick={() => setDrawerIsOpen(true)}
          >
            Browse existing patterns
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
      </div>
      <div className="wallpaper-selected-pattern">
        {(selectedPattern)
          ? (
            <img
              className="thumbnail"
              src={selectedPattern.url}
              alt={selectedPattern.label || 'no pattern selected'}
            />
          )
          : (
            <NonIdealState
              icon="issue"
              iconSize={NonIdealStateIconSize.SMALL}
              description="no pattern selected"
            />
          )}
      </div>
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
      <li key={pattern_id}>
        <Button
          onClick={() => {
            setSelectedPattern(pattern);
            closeDrawer();
          }}
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
