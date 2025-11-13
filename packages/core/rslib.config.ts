import { defineConfig } from '@rslib/core'

export default defineConfig({
  lib: [
    { format: 'esm', syntax: 'es2019', dts: true, bundle: false },
    { format: 'cjs', syntax: 'es2019', dts: true, bundle: false },
  ],
  source: {
    entry: {
      index: ['src/**/*.ts', '!src/__tests__/**/*', '!src/**/*.spec.ts'],
    },
    tsconfigPath: './tsconfig.build.json',
  },
})
