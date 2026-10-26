import { defineConfig } from 'vite';

// Relative asset URLs work both at a custom domain and GitHub Pages /repo/ paths.
export default defineConfig({
  base: './',
  build: { outDir: 'dist', sourcemap: false },
});
