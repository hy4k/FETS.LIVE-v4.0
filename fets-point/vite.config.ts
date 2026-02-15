import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  return {
    plugins: [react()],
    base: '/',
    resolve: {
      alias: {
        '@': resolve(__dirname, './src'),
        '@components': resolve(__dirname, './src/components'),
        '@hooks': resolve(__dirname, './src/hooks'),
        '@utils': resolve(__dirname, './src/utils'),
        '@types': resolve(__dirname, './src/types'),
        '@lib': resolve(__dirname, './src/lib'),
        '@contexts': resolve(__dirname, './src/contexts'),
      },
    },
    build: {
      outDir: 'dist',
      assetsDir: 'assets',
      sourcemap: mode === 'development',
      rollupOptions: {
        output: {
          manualChunks: {
            vendor: ['react', 'react-dom'],
            supabase: ['@supabase/supabase-js'],
            ui: ['lucide-react', 'framer-motion'],
            query: ['@tanstack/react-query', '@tanstack/react-query-devtools'],
          },
        },
      },
    },
    server: {
      port: 5174,
      host: '0.0.0.0',
      strictPort: false,
      hmr: {
        clientPort: 443,
        protocol: 'wss',
      },
      // 👇 add this block
      allowedHosts: [
        'localhost',
        '127.0.0.1',
        '5174-i5v7qpe7tig7djj5rdfv8-0e616f0a.sandbox.novita.ai',
      ],
    },
    preview: {
      port: 4173,
      host: true,
    },
    optimizeDeps: {
      include: ['react', 'react-dom', '@supabase/supabase-js', '@tanstack/react-query'],
    },
  }
})
