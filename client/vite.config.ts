import {defineConfig} from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from "@tailwindcss/vite";

// https://vite.dev/config/

export default defineConfig({
    plugins: [
        react(),
        tailwindcss()
    ],
    server: {
        proxy: {
            "/socket.io": {
                // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                    // @ts-expect-error
                target: import.meta.env.VITE_API_URL,
                ws: true,
            },
        },
    },
})
