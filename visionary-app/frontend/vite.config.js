import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'
import { fileURLToPath, URL } from 'node:url'

const securityHeaders = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), geolocation=(), microphone=()',
  'Cross-Origin-Opener-Policy': 'same-origin-allow-popups',
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
    "script-src 'self' https://apis.google.com https://checkout.razorpay.com https://cdn.razorpay.com https://www.google.com/recaptcha/ https://www.gstatic.com/recaptcha/",
    "frame-src https://visionary-research.firebaseapp.com https://api.razorpay.com https://checkout.razorpay.com https://www.google.com/recaptcha/ https://recaptcha.google.com/recaptcha/",
    "connect-src 'self' https://identitytoolkit.googleapis.com https://securetoken.googleapis.com https://visionary-research.firebaseapp.com https://api.razorpay.com https://checkout.razorpay.com https://lumberjack.razorpay.com https://www.google.com/recaptcha/ https://www.gstatic.com/recaptcha/",
  ].join('; '),
}

export default defineConfig(({ command, mode, isPreview }) => {
  const isProd = mode === 'production'
  const localTester = command === 'serve' && !isPreview && !isProd && loadEnv(mode, fileURLToPath(new URL('.', import.meta.url)), 'VITE_LOCAL_TEST_').VITE_LOCAL_TEST_LOGIN === 'true';
  const authApiTarget = process.env.VISIONARY_AUTH_TEST_PROXY || 'http://127.0.0.1:3001';
  if (process.env.VISIONARY_AUTH_TEST_PROXY && (isProd || !process.env.VITE_FIREBASE_PROJECT_ID?.startsWith('demo-') || !/^http:\/\/127\.0\.0\.1:\d{1,5}$/.test(authApiTarget))) throw new Error('The test auth proxy requires a development demo project and loopback target.');
  return {
    plugins: [react(), ...(localTester ? [{
      name: 'temporary-localhost-tester',
      configResolved(config) {
        if (!['localhost', '127.0.0.1', '::1'].includes(config.server.host)) throw new Error('Temporary tester credentials require a loopback-only Vite host. Remove --host overrides that expose the server.');
      },
    }] : [])],
    server: {
      host: localTester ? '127.0.0.1' : '0.0.0.0',
      headers: securityHeaders,
      proxy: { '/api': { target: authApiTarget, changeOrigin: false } },
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
      proxy: { '/api': { target: 'http://127.0.0.1:3001', changeOrigin: false } },
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
