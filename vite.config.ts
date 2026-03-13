import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig(() => {
  return {
    plugins: [
      react(), 
      tailwindcss(),
      VitePWA({
        registerType: 'autoUpdate',
        manifest: {
          name: 'LendTrack Premium',
          short_name: 'LendTrack',
          description: 'Professional Debt & Loan Management',
          theme_color: '#000000',
          background_color: '#ffffff',
          display: 'standalone',
          icons: [
            {
              src: '/icon.svg',
              sizes: 'any',
              type: 'image/svg+xml',
              purpose: 'any maskable' as any
            }
          ]
        },
        workbox: {
          globPatterns: ['**/*.{js,css,html,svg,woff,woff2}'],
          runtimeCaching: [
            {
              urlPattern: /^\/api\/(stats|borrowers|loans|chit-groups|capital|activity|auth\/me|reports)$/,
              handler: 'NetworkFirst',
              options: {
                cacheName: 'api-cache',
                expiration: { maxEntries: 50, maxAgeSeconds: 60 * 60 * 24 },
                networkTimeoutSeconds: 3,
                cacheableResponse: { statuses: [0, 200] }
              }
            },
            {
              urlPattern: /^\/api\/chit-groups\/\d+\/(members|auctions|payments)$/,
              handler: 'NetworkFirst',
              options: {
                cacheName: 'api-chit-cache',
                expiration: { maxEntries: 100, maxAgeSeconds: 60 * 60 * 24 },
                networkTimeoutSeconds: 3,
                cacheableResponse: { statuses: [0, 200] }
              }
            },
            {
              urlPattern: /^\/api\/borrowers\/\d+\/loans$/,
              handler: 'NetworkFirst',
              options: {
                cacheName: 'api-borrower-loans-cache',
                expiration: { maxEntries: 50, maxAgeSeconds: 60 * 60 * 24 },
                networkTimeoutSeconds: 3,
                cacheableResponse: { statuses: [0, 200] }
              }
            },
            {
              urlPattern: /^\/api\/loans\/\d+\/payments$/,
              handler: 'NetworkFirst',
              options: {
                cacheName: 'api-loan-payments-cache',
                expiration: { maxEntries: 100, maxAgeSeconds: 60 * 60 * 24 },
                networkTimeoutSeconds: 3,
                cacheableResponse: { statuses: [0, 200] }
              }
            },
            {
              urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/,
              handler: 'CacheFirst',
              options: {
                cacheName: 'google-fonts-stylesheets',
                expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 365 },
                cacheableResponse: { statuses: [0, 200] }
              }
            },
            {
              urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/,
              handler: 'CacheFirst',
              options: {
                cacheName: 'google-fonts-webfonts',
                expiration: { maxEntries: 30, maxAgeSeconds: 60 * 60 * 24 * 365 },
                cacheableResponse: { statuses: [0, 200] }
              }
            }
          ]
        }
      })
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
    },
    build: {
      rollupOptions: {
        output: {
          manualChunks: {
            three: ['three', '@react-three/fiber', '@react-three/drei'],
          }
        }
      }
    },
  };
});
