import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
    server: {
        allowedHosts: true, 
        host: true,         
        port: 5173
    },
    plugins: [react()],
    base: '/',
})