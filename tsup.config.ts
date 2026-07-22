import { defineConfig } from 'tsup';

export default defineConfig({
  entry: {
    index: 'src/index.ts',
    api: 'src/api/index.ts',
    table: 'src/table/index.ts',
    autocomplete: 'src/autocomplete/index.ts',
    types: 'src/types/index.ts',
    utils: 'src/utils/index.ts',
  },
  format: ['esm', 'cjs'],
  dts: true,
  sourcemap: true,
  clean: true,
  target: 'es2022',
  external: ['@tanstack/table-core', '@vueuse/core', '@vueuse/router', 'axios', 'qs', 'vue', 'vue-router'],
});
