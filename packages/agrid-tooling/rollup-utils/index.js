import resolvePlugin from '@rollup/plugin-node-resolve'
import commonjsPlugin from '@rollup/plugin-commonjs'
import typescript from '@rollup/plugin-typescript'
import dtsPlugin from 'rollup-plugin-dts'
import jsonPlugin from '@rollup/plugin-json'
import babelPlugin from '@rollup/plugin-babel'

export const resolve = (options = {}) => resolvePlugin(options)

export const commonjs = (options = {}) => commonjsPlugin(options)

export const json = (options = {}) => jsonPlugin(options)

export const babel = (options = {}) => babelPlugin(options)

export const external = (pkg) => [...Object.keys(pkg.dependencies || {}), ...Object.keys(pkg.peerDependencies || {})]

export const plugins = (extensions = []) => [
    resolvePlugin({ extensions }),
    commonjsPlugin(),
    typescript({ tsconfig: './tsconfig.json' }),
]

export const dts = (options = {}) => dtsPlugin(options)
