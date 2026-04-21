import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// The app relies on a .env file in a known location,
// which is in the frontend/ root, except when the app
// is running in docker.
let envDir = '.';

if (process.env.MODE === 'docker') {
  envDir = '/run/secrets/';
}

const CONFIG = {
  plugins: [react()],
  envDir: envDir,
  test: {
    globals: true,
    environment: 'jsdom',
  },
  server: {
    allowedHosts: true,
  },
};

// https://vitejs.dev/config/
export default defineConfig(CONFIG);
