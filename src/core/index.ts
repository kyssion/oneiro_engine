/**
 * 核心模块导出文件
 * 
 * 此文件集中导出所有核心类和类型，方便外部使用。
 * 使用示例：import { InfiniteCanvas, GridRenderer } from '@/core';
 */

// 核心画布类
export { InfiniteCanvas } from './InfiniteCanvas';       // 无限画布核心类
export { GridRenderer } from './component/GridRenderer.ts';           // 网格渲染器
export { CoordinateSystem } from './component/CoordinateSystem.ts';   // 坐标系渲染器

// 图形管理类
export { ShapeManager } from './shapes/ShapeManager.ts';           // 图形生命周期管理
export { InteractionManager } from './InteractionManager'; // 交互管理器

// 导出所有图形类（Shape, Rectangle, Circle, Triangle）
export * from './shapes';

// 导出所有类型定义
export * from './types';
