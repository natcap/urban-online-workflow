import { test, expect, vi } from 'vitest';
import React from 'react';
import { render, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom/extend-expect';

import TileLayer from 'ol/layer/Tile';
import VectorTileLayer from 'ol/layer/VectorTile';
import Source from 'ol/source/Source';

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
    getPatterns: () => null,
    getNLUDTier2: () => [],
    getNLUDTier3: () => [],
    getNLCD: () => [],
    getLucode: () => null,
  };
});

// avoid loading LULCs by using a generic Source
vi.mock('ol/source/GeoTIFF', () => {
  return {
    default: Source
  };
});

// avoid requests to third-party tile servers
vi.mock('../src/map/baseLayers', () => {
  return {
    satelliteLayer: new TileLayer(),
    lightMapLayer: new TileLayer(),
    streetMapLayer: new TileLayer(),
    labelLayer: new TileLayer(),
    parcelLayer: new VectorTileLayer(),
  };
});

afterEach(() => {
  vi.restoreAllMocks();
});

function renderAppWithResults() {
  const screen = render(<App />);
  return screen;
}

test('results panel is linked to map layers', async () => {
  const user = userEvent.setup();
  const screen = renderAppWithResults();

  const resultsTab = await screen.findByRole('tab', { name: 'results' });
  expect(resultsTab).toBeEnabled();

  // Scenarios layers should be enabled
  const layersBtn = await screen.findByRole('button', { name: 'open map layers panel' });
  await user.click(layersBtn);
  const scenarioCheckbox = await screen.getByRole('checkbox', { name: /scenarios/i });
  expect(scenarioCheckbox).toBeChecked();

  // select box in results panel should update the map layers
  const resultsDiv = screen.getByTestId('results');
  let scenarioSelect = await within(resultsDiv).findByLabelText('select scenario');
  await user.selectOptions(scenarioSelect, 'a1');
  const radioA = await screen.findByRole('radio', { name: 'a1' });
  expect(radioA).toBeChecked();
  // This query for select is redundant, but selectOptions does not trigger w/o it
  scenarioSelect = await within(resultsDiv).findByLabelText('select scenario');
  await user.selectOptions(scenarioSelect, 'b1');
  const radioB = await screen.findByRole('radio', { name: 'b1' });
  expect(radioB).toBeChecked();
});

// Wallpapering is currently disabled.
// https://github.com/natcap/urban-online-workflow/issues/125
test.skip('wallpapering toggle is linked to map layers', async () => {
  const user = userEvent.setup();
  const screen = renderAppWithResults();

  // Scenarios layers should be enabled
  const layersBtn = await screen.findByRole('button', { name: 'open map layers panel' });
  await user.click(layersBtn);
  const scenarioCheckbox = await screen.getByRole('checkbox', { name: /scenarios/i });
  expect(scenarioCheckbox).toBeChecked();

  const wallpaperRadio = await screen.findByRole('radio', { name: 'wallpaper' });
  await user.click(wallpaperRadio);
  const wallpaperSwitch = await screen.findByRole('checkbox', { name: 'Create new pattern' });
  await user.click(wallpaperSwitch);

  // During wallpapering, turn off scenarios in order to display base LULC
  expect(scenarioCheckbox).not.toBeChecked();
  const basemapRadio = await screen.findByRole('radio', { name: 'Landcover' });
  expect(basemapRadio).toBeChecked();
});
