/**
 * Vite 配置文件
 * 
 * 此文件配置 Vite 开发服务器和构建过程。
 * Vite 是一个现代化的构建工具，在开发过程中提供快速的热模块替换（HMR），
 * 并为生产环境提供优化的构建。
 * 
 * 主要配置项：
 * - 路径别名，方便导入模块 (@/ -> src/)
 * - 开发服务器设置（端口、自动打开、网络访问）
 * - 构建输出配置
 */

import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  // 模块导入的解析配置
  resolve: {
    alias: {
      // 启用 '@' 作为 'src' 目录的别名
      // 这样可以使用: import { Shape } from '@/core'
      // 而不是: import { Shape } from '../../core'
      '@': resolve(__dirname, 'src'),
    },
  },
  // 开发服务器配置
  server: {
    port: 3000,              // 开发服务器运行在 3000 端口
    open: true,              // 服务器启动时自动打开浏览器
    host: true,              // 监听所有网络接口（允许通过 IP 访问）
  },
  // 生产环境构建配置
  build: {
    outDir: 'dist',          // 生产构建的输出目录
    sourcemap: true,         // 生成 source map 文件，便于调试
  },
});
