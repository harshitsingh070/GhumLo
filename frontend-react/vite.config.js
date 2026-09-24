import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // outDir default is "dist" -> /frontend-react/dist (committed to git,
  // served by FastAPI so judges never need Node).
  server: {
    // Dev-only: forward /api/* to the FastAPI backend so fetch('/api/plan')
    // works from the Vite dev server. Production needs no proxy — the built
    // files are served from the same origin as the API.
    proxy: {
      '/api': 'http://localhost:8000',
    },
  },
})
