import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from "@tailwindcss/vite"

export default defineConfig(() => {

    return {
        plugins: [
            react(),
            tailwindcss()
        ],
        server: {
            proxy: {
                '/socket.io': {
                    target: 'https://chat-websocket-3k7r.onrender.com',
                    changeOrigin: true,
                    ws: true,
                    secure: true
                }
            }
        },
    }
})