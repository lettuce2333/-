import path from 'node:path'
import { defineConfig } from '@tarojs/cli'

// Node 24 下 Taro 依赖预编译可能失败，导致 CLI 加载 app.config.ts 时缺少运行时全局常量。
// 这里在加载配置阶段提前声明，避免 ReferenceError；最终小程序产物仍由 webpack DefinePlugin 注入。
;(globalThis as any).ENABLE_INNER_HTML = false
;(globalThis as any).ENABLE_ADJACENT_HTML = false
;(globalThis as any).ENABLE_SIZE_APIS = false
;(globalThis as any).ENABLE_TEMPLATE_CONTENT = false
;(globalThis as any).ENABLE_CLONE_NODE = false
;(globalThis as any).ENABLE_CONTAINS = false
;(globalThis as any).ENABLE_MUTATION_OBSERVER = false

export default defineConfig({
  projectName: 'youpin-miniapp',
  date: '2026-7-31',
  designWidth: 750,
  deviceRatio: {
    640: 2.34 / 2,
    750: 1,
    375: 2,
    828: 1.81 / 2,
  },
  sourceRoot: 'src',
  outputRoot: 'dist',
  framework: 'react',
  compiler: 'webpack5',
  plugins: [],
  alias: {
    '@': path.resolve(__dirname, '..', 'src'),
  },
  defineConstants: {
    TARO_APP_API_BASE: JSON.stringify(process.env.TARO_APP_API_BASE || 'http://localhost:4000'),
  },
  copy: {
    patterns: [],
    options: {},
  },
  mini: {
    postcss: {
      pxtransform: {
        enable: true,
        config: {},
      },
      cssModules: {
        enable: false,
        config: {
          namingPattern: 'module',
          generateScopedName: '[name]__[local]___[hash:base64:5]',
        },
      },
    },
  },
  h5: {},
})
