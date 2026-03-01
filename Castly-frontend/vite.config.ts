import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  const env = loadEnv(mode, process.cwd(), '')
  
  const backendUrl = env.VITE_BACKEND_URL || 'http://localhost:8000'
  const devPort = parseInt(env.VITE_DEV_PORT || '3000', 10)
  
  return {
    plugins: [react(), tailwindcss()],
    server: {
      port: devPort,
      proxy: {
        '/api': {
          target: backendUrl,
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api/, ''),
        },
        '/ws': {
          target: backendUrl.replace(/^http/, 'ws'),
          ws: true,
        },
      },
    },
  }
})
