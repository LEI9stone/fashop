import { defineConfig } from '@tarojs/cli'

export default defineConfig({
  projectName: 'fashop-seller',
  date: '2026-02-27',
  designWidth: 750,
  deviceRatio: { 640: 2.34 / 2, 750: 1, 828: 1.81 / 2 },
  sourceRoot: 'src',
  outputRoot: 'dist',
  plugins: [],
  defineConstants: {},
  copy: { patterns: [], options: {} },
  framework: 'react',
  compiler: 'webpack5',
  cache: { enable: false },
  h5: {
    publicPath: '/',
    staticDirectory: 'static',
    devServer: { port: 3001 },
    postcss: {
      autoprefixer: { enable: true },
      cssModules: { enable: true, config: { namingPattern: 'module', generateScopedName: '[name]__[local]___[hash:base64:5]' } },
    },
  },
})
