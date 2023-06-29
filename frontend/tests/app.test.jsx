import { it, expect } from 'vitest';
import React from 'react';
import { render } from '@testing-library/react';

import App from '../src/App';

import '@testing-library/jest-dom/extend-expect';

it('should import', async () => {
  const screen = render(<App />);
  const areaSelect = await screen.findByLabelText('Study Area');
  expect(areaSelect).toHaveTextContent('Untitled');
});
