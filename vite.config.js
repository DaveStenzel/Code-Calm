import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      strategies: 'injectManifest',
      srcDir: 'src',
      filename: 'service-worker.js',
      injectRegisterSW: false, // useServiceWorker.js handles registration
      manifest: false,         // public/manifest.json is used as-is
      injectManifest: {
        // Glob all built assets — vite-plugin-pwa replaces self.__WB_MANIFEST
        // with this list (including real hashed filenames) at build time
        globPatterns: ['**/*.{js,css,html}'],
      },
      devOptions: {
        enabled: true,
        type: 'classic',
      },
    }),
  ],
})
