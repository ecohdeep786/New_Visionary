import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { fileURLToPath, URL } from 'node:url'

const securityHeaders = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), geolocation=(), microphone=()',
  'Cross-Origin-Opener-Policy': 'same-origin',
  'Cross-Origin-Resource-Policy': 'same-origin',
}

const productionSecurityHeaders = {
  ...securityHeaders,
  'Content-Security-Policy': [
    "default-src 'self'",
    "base-uri 'self'",
    "object-src 'none'",
    "frame-ancestors 'none'",
    "form-action 'self'",
    "manifest-src 'self'",
    "img-src 'self' data: https://storage.googleapis.com",
    "font-src 'self'",
    "style-src 'self' 'unsafe-inline'",
    "script-src 'self'",
    "connect-src 'self'",
  ].join('; '),
}

export default defineConfig(({ command, mode }) => {
  const isProd = mode === 'production'
  return {
    plugins: [react()],
    server: {
      host: '0.0.0.0',
      headers: securityHeaders,
      watch: {
        // Rename-on-save editors race chokidar's fs.watch on Windows: the
        // watch lands on a file mid-replace and the server dies with EBUSY.
        // Polling sidesteps fs.watch entirely — reliable on Windows.
        usePolling: true,
        interval: 300,
        ignored: [
          '**/*.TMP', '**/*.tmp', '**/*.tmpdir/**', '**/~*',
          '**/backend/**', '**/ml/**', '**/reverse-engineering/**', '**/.tools/**',
          '**/integration/upstream-lock.json',
        ],
      },
    },
    preview: {
      headers: productionSecurityHeaders,
    },
    build: {
      target: 'esnext',
      cssCodeSplit: true,
      chunkSizeWarningLimit: 600,
      // Minify with esbuild for speed and smaller output
      minify: isProd ? 'esbuild' : false,
      // Use esbuild for CSS minification (faster than postcss)
      cssMinify: isProd ? 'esbuild' : true,
      // Reduce unused CSS by enabling dead code elimination
      commonjsOptions: {
        include: [/node_modules/],
      },
      // Optimize rollup output
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (id.includes('node_modules')) {
              if (id.includes('recharts')) {
                return 'vendor-charts';
              }
              if (id.includes('framer-motion')) {
                return 'vendor-motion';
              }
              if (id.includes('react-router-dom')) {
                return 'vendor-router';
              }
              if (id.includes('@radix-ui')) {
                return 'vendor-radix';
              }
              if (id.includes('lucide-react')) {
                return 'vendor-icons';
              }
              return 'vendor';
            }
          },
          // Ensure async chunks get inline dynamic imports
          chunkFileNames: 'assets/[name]-[hash].js',
          entryFileNames: 'assets/[name]-[hash].js',
          assetFileNames: ({ name }) => {
            if (/\.(gif|jpe?g|png|webp|svg)$/.test(name || '')) return 'assets/images/[name]-[hash][extname]';
            return 'assets/[name]-[hash][extname]';
          },
        },
      },
      // Increase parallel workers for faster builds
      maxWorkersIncrease: 'max-memory',
    },
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
        '@/api/base44Client': fileURLToPath(new URL('./src/api/appClient.js', import.meta.url)),
      },
    },
  }
})
