import { defineConfig } from 'vite';
export default defineConfig({
    server: {
        allowedHosts: [
            "weather.henzmiguel.dev",
        ],
        port: 5173,
        strictPort: true,
        host: '0.0.0.0',
        proxy: {
            '/api': process.env.API_PROXY_TARGET || 'http://127.0.0.1:3000',
        },
    },
});