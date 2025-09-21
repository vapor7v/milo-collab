import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";


// https://vitejs.dev/config/
export default defineConfig(() => ({
  server: {
    host: "localhost",
    port: 8080,
    fs: {
      allow: ["./src", "./node_modules"],
    },
  },
  plugins: [
    react(),
  // ...existing code...
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // React and core libraries
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],

          // UI libraries
          'ui-vendor': [
            '@radix-ui/react-dialog',
            '@radix-ui/react-dropdown-menu',
            '@radix-ui/react-progress',
            '@radix-ui/react-slot',
            '@radix-ui/react-toast',
            '@radix-ui/react-tooltip'
          ],

          // Firebase
          'firebase-vendor': ['firebase/app', 'firebase/auth', 'firebase/firestore'],

          // Large utility libraries
          'utils-vendor': [
            'lucide-react',
            'class-variance-authority',
            'clsx',
            'tailwind-merge',
            'date-fns'
          ],

          // Form handling
          'forms-vendor': ['react-hook-form', '@hookform/resolvers', 'zod'],

          // Charts and data visualization (if used)
          'charts-vendor': ['recharts'],

          // Heavy components
          'dashboard': ['./src/pages/Dashboard.tsx'],
          'meditation': ['./src/pages/MeditationChallenge.tsx'],
          'journal': ['./src/pages/journal.tsx'],
          'aichat': ['./src/pages/AIChat.tsx']
        },
        // Optimize chunk file names
        chunkFileNames: (chunkInfo) => {
          const facadeModuleId = chunkInfo.facadeModuleId
            ? chunkInfo.facadeModuleId.split('/').pop()?.replace('.tsx', '').replace('.ts', '')
            : 'chunk';
          return `assets/${facadeModuleId}-[hash].js`;
        },
        assetFileNames: (assetInfo) => {
          if (assetInfo.name?.endsWith('.css')) {
            return 'assets/index-[hash].css';
          }
          return 'assets/[name]-[hash][extname]';
        }
      }
    },
    // Increase chunk size warning limit
    chunkSizeWarningLimit: 1000,
    // Enable source maps for better debugging
    sourcemap: false,
    // Minify for production
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true
      }
    }
  }
}));
