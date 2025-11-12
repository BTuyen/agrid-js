import { defineConfig } from 'nuxt-module-build'

export default defineConfig({
  failOnWarn: false,
  externals: [
    '@agrid/browser',
    '@agrid/node'
  ],
})
