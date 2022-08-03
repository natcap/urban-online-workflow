import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// The app relies on a .env file in a known location,
// which is in the frontend/ root, except when the app
// is running in docker.
let envDir = '.';

// We need public files to be written to a known place.
// Within docker, this is /opt/appdata.  Locally, it's in ../appdata.
let appdataDir = '../appdata/';
if (process.env.MODE === 'docker') {
  envDir = '/run/secrets/';
  appdataDir = '/opt/appdata/';
}

const CONFIG = {
  plugins: [react()],
  envDir: envDir,
  publicDir: appdataDir,
  test: {
    globals: true,
    environment: 'happy-dom',
    coverage: { // https://github.com/bcoe/c8
      all: true,
      src: 'src',
    },
  },
};

// https://vitejs.dev/config/
export default defineConfig(CONFIG);
