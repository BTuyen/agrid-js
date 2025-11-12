import resolvePlugin from '@rollup/plugin-node-resolve'
import commonjs from '@rollup/plugin-commonjs'
import typescript from '@rollup/plugin-typescript'
import dtsPlugin from 'rollup-plugin-dts'

export const resolve = (options = {}) => resolvePlugin(options)

export const external = (pkg) => [...Object.keys(pkg.dependencies || {}), ...Object.keys(pkg.peerDependencies || {})]

export const plugins = (extensions = []) => [
    resolvePlugin({ extensions }),
    commonjs(),
    typescript({ tsconfig: './tsconfig.json' }),
]

export const dts = (options = {}) => dtsPlugin(options)
