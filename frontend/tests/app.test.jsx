import { test, expect } from 'vitest';
import React from 'react';
import { render, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom/extend-expect';

import App from '../src/App';

test('rename study area', async () => {
  const user = userEvent.setup();
  const screen = render(<App />);
  const areaSelect = await screen.findByLabelText('Study Area');
  expect(areaSelect).toHaveDisplayValue('Untitled');

  const renameField = await screen.findByRole('textbox', 'Untitled');
  await user.clear(renameField);
  const name = 'foo';
  await user.type(renameField, name);
  await user.click(screen.getByRole('button', { name: 'Rename' }));
  await waitFor(() => expect(areaSelect).toHaveDisplayValue(name));
});

