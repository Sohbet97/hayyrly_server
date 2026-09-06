import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig(({ command }) => ({
  // Served under https://hayyrly.com.tm/admin/ in production; root in dev.
  base: command === 'build' ? '/admin/' : '/',
  plugins: [react(), tailwindcss()],
  server: {
    port: 5173,
    proxy: {
      // Published map style + the absolute URLs it references (tiles, fonts).
      '/map-styles': { target: 'https://hayyrly.com.tm', changeOrigin: true },
      '/map':        { target: 'https://hayyrly.com.tm', changeOrigin: true },
      '/fonts':      { target: 'https://hayyrly.com.tm', changeOrigin: true },
      '/osrm':       { target: 'https://hayyrly.com.tm', changeOrigin: true },
      // Local backend API + realtime socket (see server/server.js, PORT defaults to 3000).
      '/api':        { target: 'http://localhost:3000', changeOrigin: true },
      '/socket.io':  { target: 'http://localhost:3000', changeOrigin: true, ws: true },
      // Uploaded media (driver/car photos etc.) served statically by the backend.
      '/uploads':    { target: 'http://localhost:3000', changeOrigin: true },
    },
  },
}))
