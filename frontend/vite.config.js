import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default ({ mode }) => {
  const env = loadEnv(mode, process.cwd());
  const API_URL = env.VITE_API_URL || 'http://localhost:5000/api';

  return defineConfig({
    plugins: [react()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    server: {
      fs: {
        strict: true,
      },
      proxy: {
        "/api": `${API_URL}`,
        "/public": `${API_URL}`,
      },
    },
  });
};
