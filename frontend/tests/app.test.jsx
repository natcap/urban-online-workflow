import { test, expect, vi } from 'vitest';
import React from 'react';
import { render, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom/extend-expect';

import TileLayer from 'ol/layer/Tile';

import App from '../src/App';

import STUDY_AREA from './fixtures/studyArea.json';
import SCENARIOS from './fixtures/scenarios.json';
import JOBS from './fixtures/jobs.json';
import INVEST_RESULT from './fixtures/investResult.json';

vi.mock('../src/requests', () => {
  return {
    createSession: () => 'foo',
    getSession: () => 'foo',
    getStudyArea: () => STUDY_AREA,
    getStudyAreas: () => [STUDY_AREA],
    getScenarios: () => SCENARIOS,
    getJobStatus: () => 'success',
    runInvest: () => JOBS,
    getInvestResults: () => INVEST_RESULT,
  };
});

vi.mock('../src/map/lulcLayer', () => {
  return {
    lulcTileLayer: () => new TileLayer()
  };
});

vi.mock('../src/map/baseLayers', () => {
  return {
    satelliteLayer: new TileLayer(),
    lightMapLayer: new TileLayer(),
    streetMapLayer: new TileLayer(),
    labelLayer: new TileLayer(),
  };
});

afterEach(() => {
  vi.restoreAllMocks();
});

test('run models', async () => {
  const user = userEvent.setup();
  const screen = render(<App />);

  const runBtn = await screen.findByRole('button', { name: 'Evaluate Impacts' });
  await user.click(runBtn);
  const resultsTab = await screen.findByRole('tab', { name: 'results' });
  expect(resultsTab).toBeEnabled();

  // const scenarioSelect = await within(resultsTab).findByRole('option');
  // await user.selectOptions(scenarioSelect, 'b1');
  const layersBtn = await screen.findByRole('button', { name: 'open map layers panel' });
  await user.click(layersBtn);
  const scenarioLayer = await screen.findByRole('checkbox', { name: 'b1' });
  expect(scenarioLayer).toBeChecked();
});
