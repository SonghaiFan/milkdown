import vueJsx from '@vitejs/plugin-vue-jsx'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [vueJsx()],
  resolve: {
    alias: {
      '@milkdown/prose/view/style/prosemirror.css': fileURLToPath(
        new URL(
          '../packages/prose/node_modules/prosemirror-view/style/prosemirror.css',
          import.meta.url
        )
      ),
      '@milkdown/prose/tables/style/tables.css': fileURLToPath(
        new URL(
          '../packages/prose/node_modules/prosemirror-tables/style/tables.css',
          import.meta.url
        )
      ),
    },
  },
  build: {
    outDir: '../lib',
    emptyOutDir: true,
  },
  server: {
    fs: {
      strict: false,
    },
  },
})
