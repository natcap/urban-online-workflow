import { describe, it } from 'vitest';
import React from 'react';
import {
  render,
} from '@testing-library/react';

import App from '../src/App';

describe('App', () => {
  it('should import', () => {
    render(<App />);
  });
});
