import { resolve, dts } from '@agrid-tooling/rollup-utils'
import commonjs from '@rollup/plugin-commonjs'
import typescript from '@rollup/plugin-typescript'
import copy from 'rollup-plugin-copy'

const extensions = ['.js', '.jsx', '.ts', '.tsx']

// 🔹 Định nghĩa plugins một lần
const plugins = [
  resolve({ extensions }),
  commonjs(),
  typescript({ tsconfig: './tsconfig.json' }),
]

/**
 * Configuration for the ESM build
 */
const buildEsm = {
  external: ['@agrid/browser', 'react'],
  input: ['src/index.ts'],
  output: {
    file: 'dist/esm/index.js',
    format: 'esm',
    sourcemap: true,
  },
  plugins,
}

/**
 * Configuration for the UMD build
 */
const buildUmd = {
  external: ['@agrid/browser', 'react'],
  input: './src/index.ts',
  output: {
    file: 'dist/umd/index.js',
    name: 'AgridReact',
    globals: {
    react: 'React',
    '@agrid/browser': 'Agrid',
    },
    format: 'umd',
    sourcemap: true,
    esModule: false,
  },
  plugins,
}

/**
 * Configuration for type declarations (.d.ts)
 */
const buildTypes = {
  external: ['@agrid/browser', 'react'],
  input: './src/index.ts',
  output: {
    file: 'dist/types/index.d.ts',
    format: 'es',
  },
  plugins: [
    resolve(),
    dts(),
    copy({
      hook: 'writeBundle',
      targets: [
        { src: 'dist/*', dest: '../browser/react/dist' },
        { src: 'src/*', dest: '../browser/react/src' },
      ],
    }),
  ],
}

export default [buildEsm, buildUmd, buildTypes]
