import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist/webview',
    rollupOptions: {
      input: resolve(__dirname, 'src/webview/main.tsx'),
      output: {
        entryFileNames: 'index.js',
        assetFileNames: 'index.[ext]'
      }
    },
    target: 'es2020',
    minify: false,
    // sourcemap を無効化 → CSPの connect-src 'none' で .map ファイルがブロックされるのを防ぐ
    sourcemap: false
  },
  define: {
    'process.env.NODE_ENV': JSON.stringify('production')
  }
});
