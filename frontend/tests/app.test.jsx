import { describe, expect, it } from 'vitest';
import React from 'react';
import {
  render,
  screen,
} from '@testing-library/react';

import App from '../src/App';

it('everything', () => {
  render(<App />);
  const map = screen.getByTitle('Map');
  screen.debug(map);
  expect(true).toBe(false);
});
