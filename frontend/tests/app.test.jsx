import { describe, expect, it } from 'vitest';
import React from 'react';
import {
  render,
  screen,
} from '@testing-library/react';

import App from '../src/App';

describe('App', () => {
  it('should import', () => {
    render(<App />);
  });
});
