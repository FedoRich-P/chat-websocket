import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from "@tailwindcss/vite"

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, process.cwd(), 'VITE_')

    return {
        plugins: [
            react(),
            tailwindcss()
        ],
        server: {
            proxy: {
                "/socket.io": {
                    target: env.VITE_API_URL || 'http://localhost:5000', // Fallback
                    ws: true,
                    changeOrigin: true
                },
            },
        },
    }
})