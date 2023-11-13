import { test, expect, vi } from 'vitest';
import React from 'react';
import { render, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom/extend-expect';

import Edit from '../src/edit/edit';
import STUDY_AREA from './fixtures/studyArea.json';
import SCENARIOS from './fixtures/scenarios.json';
import INVEST_RESULT from './fixtures/investResult.json';

vi.mock('../src/requests', () => {
  return {
    getInvestResults: () => INVEST_RESULT,
    getNLUDTier2: () => [],
    getNLUDTier3: () => [],
    getNLCD: () => [],
    getLucode: () => null,
  };
});

function renderEdit(studyArea, scenarios, patternSamplingMode = false) {
  const screen = render(
    <Edit
      sessionID="A"
      studyArea={studyArea}
      setHoveredParcel={() => {}}
      refreshStudyArea={() => {}}
      nameStudyArea={() => {}}
      switchStudyArea={() => {}}
      savedStudyAreas={[studyArea]}
      refreshScenarios={() => {}}
      scenarios={scenarios}
      patternSamplingMode={patternSamplingMode}
      togglePatternSamplingMode={() => {}}
      patternSampleWKT={null}
      setSelectedScenario={() => {}}
      setServiceshedPath={() => {}}
    />
  );
  return screen;
}

test('no parcel present in study area', async () => {
  const studyArea = {
    id: undefined,
    parcels: [],
  };
  const scenarios = [];
  const screen = renderEdit(studyArea, scenarios);

  const studyAreaTable = await screen.queryByRole('table');
  expect(studyAreaTable).toBeNull();

  const scenarioBuilder = await screen.queryByText(/choose new landuse/);
  expect(scenarioBuilder).toBeNull();

  const createScenario = await screen.queryByText(/Create a scenario/);
  expect(createScenario).toBeNull();
});

test('parcel present in study area, without scenarios', async () => {
  const scenarios = [];
  const screen = renderEdit(STUDY_AREA, scenarios);

  const addressCell = await screen.findByText(STUDY_AREA.parcels[0].address);

  const createScenario = await screen.getByText(/Create a scenario/);
  expect(createScenario).toBeInTheDocument();
});

test('scenarios & results exist', async () => {
  const screen = renderEdit(STUDY_AREA, SCENARIOS);

  const tableText = await screen.findByText(/baseline/);
  const table = tableText.closest('table');
  const rows = within(table).getAllByRole('row');
  const cols = within(rows[1]).getAllByRole('cell');
  expect(rows).toHaveLength(2); // number of diff lulc types represented, + header
  expect(cols).toHaveLength(SCENARIOS.length + 1);

  const investBtn = await screen.getByRole('button', { name: /Evaluate Impacts/ });
  await waitFor(() => expect(investBtn).not.toBeEnabled());
});
