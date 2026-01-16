
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      // Diz ao Rollup que esses módulos são externos e serão providos pelo navegador (importmap)
      external: [
        'react',
        'react-dom',
        'react-dom/client',
        'lucide-react',
        '@supabase/supabase-js'
      ],
      output: {
        globals: {
          react: 'React',
          'react-dom': 'ReactDOM',
          'lucide-react': 'LucideReact',
          '@supabase/supabase-js': 'supabase'
        }
      }
    }
  }
});
