import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 8732,
    proxy: {
      '/api': 'http://localhost:8731',
      '/assets': 'http://localhost:8731'
    }
  }
})
