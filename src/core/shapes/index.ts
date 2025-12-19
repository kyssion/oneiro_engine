/**
 * 图形模块导出文件
 * 
 * 集中导出所有图形类。
 */

// 基类和工具函数
export { Shape, generateId } from './Shape';   // 图形抽象基类和 ID 生成器

// 具体图形类
export { Rectangle } from './Rectangle';       // 矩形
export { Circle } from './Circle';             // 圆形/椭圆
export { Triangle } from './Triangle';         // 三角形
