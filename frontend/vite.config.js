import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Thap app relies on a .env file in a know location,
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
    environment: 'happy-dom',
    coverage: { // https://github.com/bcoe/c8
      all: true,
      src: 'src',
    },
  },
};

// https://vitejs.dev/config/
export default defineConfig(CONFIG);
