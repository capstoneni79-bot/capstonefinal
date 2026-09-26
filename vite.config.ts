import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';
import {VitePWA} from 'vite-plugin-pwa';

export default defineConfig(() => {
  return {
    plugins: [
      react(),
      tailwindcss(),
      VitePWA({
        registerType: 'autoUpdate',
        workbox: {
          maximumFileSizeToCacheInBytes: 15 * 1024 * 1024,
          globPatterns: ['**/*.{js,css,html,ico,png,svg,woff,woff2,json,geojson}'],
          skipWaiting: true,
          clientsClaim: true,
          navigateFallback: '/index.html',
          navigateFallbackDenylist: [/^\/api\//],
          runtimeCaching: [
            {
              urlPattern: /^\/api\//i,
              handler: 'NetworkFirst',
              options: {
                cacheName: 'api-runtime-cache',
                networkTimeoutSeconds: 8,
                expiration: {
                  maxEntries: 100,
                  maxAgeSeconds: 60 * 15, // 15 minutes max
                },
                cacheableResponse: {
                  statuses: [0, 200],
                },
              },
            },
            {
              urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
              handler: 'CacheFirst',
              options: {
                cacheName: 'google-fonts-cache',
                expiration: {
                  maxEntries: 20,
                  maxAgeSeconds: 60 * 60 * 24 * 365,
                },
                cacheableResponse: {
                  statuses: [0, 200],
                },
              },
            },
            {
              urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
              handler: 'CacheFirst',
              options: {
                cacheName: 'gstatic-fonts-cache',
                expiration: {
                  maxEntries: 20,
                  maxAgeSeconds: 60 * 60 * 24 * 365,
                },
                cacheableResponse: {
                  statuses: [0, 200],
                },
              },
            },
            {
              urlPattern: /\/data\/.*\.geojson$/i,
              handler: 'StaleWhileRevalidate',
              options: {
                cacheName: 'geojson-boundary-cache',
                expiration: {
                  maxEntries: 30,
                  maxAgeSeconds: 60 * 60 * 24 * 30, // 30 days
                },
              },
            },
          ],
        },
        includeAssets: ['icon.svg', 'data/barangay_level_4.geojson'],
        manifest: {
          id: '/',
          name: 'DA Hinunangan Swine Registry',
          short_name: 'DASwineReg',
          description: 'DA Hinunangan Swine Registry with offline access, GIS mapping, and biosecurity monitoring.',
          theme_color: '#15803d',
          background_color: '#fbfbfb',
          display: 'standalone',
          start_url: '/',
          scope: '/',
          icons: [
            {
              src: '/icon.svg',
              sizes: 'any',
              type: 'image/svg+xml',
              purpose: 'any',
            },
          ],
        },
        devOptions: {
          enabled: true,
          type: 'module',
        },
      }),
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    build: {
      chunkSizeWarningLimit: 1000,
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (id.includes('node_modules')) {
              if (id.includes('react/') || id.includes('react-dom/')) {
                return 'vendor-react';
              }
              if (id.includes('@google/genai')) {
                return 'vendor-genai';
              }
              if (id.includes('xlsx')) {
                return 'vendor-xlsx';
              }
              if (id.includes('jspdf') || id.includes('html2canvas')) {
                return 'vendor-pdf';
              }
              if (id.includes('leaflet') || id.includes('@vis.gl') || id.includes('@turf') || id.includes('shpjs')) {
                return 'vendor-gis';
              }
              if (id.includes('recharts') || id.includes('d3-')) {
                return 'vendor-charts';
              }
              if (id.includes('lucide-react') || id.includes('motion')) {
                return 'vendor-ui';
              }
              if (id.includes('firebase')) {
                return 'vendor-firebase';
              }
            }
          },
        },
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify - file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
