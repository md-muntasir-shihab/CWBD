import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const FRONTEND_PORT = Number(process.env.PORT || process.env.VITE_PORT || 5175);
const API_PROXY_TARGET = process.env.VITE_API_PROXY_TARGET || 'http://localhost:5003';

export default defineConfig({
    plugins: [react()],
    server: {
        port: FRONTEND_PORT,
        strictPort: true,
        proxy: {
            '/api': {
                target: API_PROXY_TARGET,
                changeOrigin: true,
            },
            '/uploads': {
                target: API_PROXY_TARGET,
                changeOrigin: true,
            },
        },
    },
});
