import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// GitHub Pages serves the site from /AIAudit-App/; local dev serves from /.
export default defineConfig(({ command }) => ({
  base: command === 'build' ? '/AIAudit-App/' : '/',
  plugins: [react()],
  resolve: { alias: { '@': path.resolve(__dirname, './src') } },
}))
