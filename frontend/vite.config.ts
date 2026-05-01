import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import { nodePolyfills } from 'vite-plugin-node-polyfills'
import path from 'path'

const configuredApiBase = process.env.VITE_API_PROXY_TARGET || process.env.VITE_API_URL || ''
const apiProxyTarget = configuredApiBase.replace(/\/api\/?$/, '').replace(/\/+$/, '')

export default defineConfig({
  root: path.resolve(__dirname),
  plugins: [
    react(),
    nodePolyfills({
      globals: {
        Buffer: true,
        global: false,
        process: true,
      },
    }),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'corridor-logo.svg'],
      workbox: {
        maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
      },
      manifest: {
        name: 'Corridor Financial OS',
        short_name: 'Corridor',
        description: 'Infrastructure for modern businesses',
        start_url: '/',
        display: 'standalone',
        theme_color: '#ffffff',
        background_color: '#ffffff',
        icons: [
          {
            src: 'corridor-logo.svg',
            sizes: 'any',
            type: 'image/svg+xml'
          },
          {
            src: 'favicon.svg',
            sizes: '64x64',
            type: 'image/svg+xml'
          }
        ]
      }
    })
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  define: {
    'process.env': {},
    'process.version': JSON.stringify(process.version),
  },
  server: {
    port: 3000,
    host: true,
    proxy: apiProxyTarget
      ? {
        '/api': {
          target: apiProxyTarget,
          changeOrigin: true,
          secure: false,
        },
      }
      : undefined,
  }
})
