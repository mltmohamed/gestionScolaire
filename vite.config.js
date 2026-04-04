import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

/** Sous Electron (file://), crossorigin sur script/link peut empêcher le chargement des modules. */
function electronStripCrossorigin() {
  return {
    name: 'electron-strip-crossorigin',
    transformIndexHtml: {
      order: 'post',
      handler(html) {
        return html.replace(/\s+crossorigin(?:=(?:""|''))?/g, '');
      },
    },
  };
}

export default defineConfig({
  plugins: [react(), electronStripCrossorigin()],
  base: './',
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src/renderer/src'),
    },
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    modulePreload: false,
  },
  server: {
    port: 5173,
  },
});
