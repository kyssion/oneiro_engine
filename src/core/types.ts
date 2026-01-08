/**
 * 画布引擎的通用类型定义
 * 
 * 此文件定义了整个画布引擎系统中使用的所有核心类型、接口和枚举。
 * 包括坐标、变换、网格、图形、交互等相关的数据结构。
 */

/**
 * 二维坐标点
 * 用于表示画布上的位置、偏移量等
 */
export interface Point {
  x: number;  // X 坐标（水平方向）
  y: number;  // Y 坐标（垂直方向）
}

/**
 * 画布变换状态
 * 描述画布的缩放和平移变换
 */
export interface Transform {
  scale: number;    // 缩放比例（1.0 = 100%，2.0 = 200% 放大）
  offsetX: number;  // X 轴偏移量（像素）
  offsetY: number;  // Y 轴偏移量（像素）
}

/**
 * 网格图案类型
 * 定义网格的显示样式
 */
export type GridPattern = 'grid' | 'dots';  // 'grid' = 线条网格, 'dots' = 点状网格

/**
 * 网格配置选项
 * 控制网格的外观和行为
 */
export interface GridConfig {
  pattern: GridPattern;      // 网格图案类型
  baseGridSize: number;      // 基础网格大小（世界坐标单位）
  minGridSize: number;       // 最小网格大小（防止过密）
  maxGridSize: number;       // 最大网格大小（防止过疏）
  gridColor: string;         // 主网格颜色（CSS 颜色值）
  subGridColor: string;      // 次网格颜色（CSS 颜色值）
  dotRadius: number;         // 点的半径（仅用于点状网格）
  NumberOfIntervals: number; // 每一个网格中间空白格的数量
  minInterValsSize: number; // 渲染的时候网格数量的最小要求

  subLineWidth: number; // 次网格线条长度
  mainLineWidth: number; // 主网格线条长度

  mainSizeNow: number; // 缩放之后当前的一个网格的宽度
  subSizeNow: number; // 缩放之后当前一个子网格的大小
}


/**
 * 坐标轴配置选线
 * 控制坐标轴的行文
 */
export interface CoordinateSystemConfig {
  // 颜色配置
  axisColor: string;                  // 坐标轴主线颜色
  tickColor: string;                  // 刻度线颜色
  labelColor: string;                 // 数字标签颜色
  fixedModeBackgroundColor: string;   // 固定模式背景颜色

  // 样式配置
  axisWidth: number;                  // 坐标轴线宽（像素）
  tickLength: number;                 // 刻度线长度（像素）
  labelFont: string;                  // 标签字体
  labelPadding: number;               // 标签与坐标轴的间距

  displayMode: CoordinateAxisMode     // 坐标轴配置选项
}

/**
 * 画布配置选项
 * 控制画布的缩放行为
 */
export interface CanvasConfig {
  minScale: number;          // 最小缩放比例（如 0.01 = 1%）
  maxScale: number;          // 最大缩放比例（如 100 = 10000%）
  zoomSensitivity: number;   // 缩放灵敏度（控制滚轮缩放速度）
}

/**
 * 视口边界
 * 描述当前可见区域在世界坐标系中的范围
 */
export interface ViewportBounds {
  left: number;    // 左边界（世界坐标）
  right: number;   // 右边界（世界坐标）
  top: number;     // 上边界（世界坐标）
  bottom: number;  // 下边界（世界坐标）
  width: number;   // 宽度（世界坐标单位）
  height: number;  // 高度（世界坐标单位）
}

/**
 * 图形类型
 * 定义支持的图形种类
 */
export type ShapeType = 'rectangle' | 'circle' | 'triangle';


/**
 * 交互模式
 * 定义用户当前的操作模式
 */
export type InteractionMode = 
  | 'select'  // 选择模式：选中、移动、调整图形
  | 'pan'     // 平移模式：拖动画布
  | 'draw';   // 绘制模式：创建新图形

/**
 * 坐标轴显示模式
 * 定义坐标系的显示方式
 */
export type CoordinateAxisMode = 
  | 'fixed'   // 固定模式：刻度固定在画布边缘，数值随拖拽和缩放变化
  | 'origin'  // 原点模式：坐标轴跟随原点移动，传统坐标系显示
  | 'hidden'; // 隐藏模式：不显示坐标轴

/**
 * 边界框
 * 描述图形的矩形包围盒
 */
export interface BoundingBox {
  x: number;       // 左上角 X 坐标
  y: number;       // 左上角 Y 坐标
  width: number;   // 宽度
  height: number;  // 高度
}

/**
 * 图形样式
 * 定义图形的视觉外观
 */
export interface ShapeStyle {
  fillColor: string;    // 填充颜色（CSS 颜色值）
  strokeColor: string;  // 描边颜色（CSS 颜色值）
  strokeWidth: number;  // 描边宽度（像素）
  opacity: number;      // 不透明度（0-1，0=完全透明，1=完全不透明）
}

/**
 * 图形数据
 * 包含图形的完整状态信息（用于序列化/反序列化）
 */
export interface ShapeData {
  id: string;           // 唯一标识符
  type: ShapeType;      // 图形类型
  x: number;            // X 坐标（左上角）
  y: number;            // Y 坐标（左上角）
  width: number;        // 宽度
  height: number;       // 高度
  rotation: number;     // 旋转角度（弧度，暂未实现）
  style: ShapeStyle;    // 样式配置
}

/**
 * 调整大小的控制点类型
 * 定义图形边界上的 8 个控制点位置
 */
export type ResizeHandle = 
  | 'top-left'       // 左上角
  | 'top-center'     // 上边中点
  | 'top-right'      // 右上角
  | 'middle-left'    // 左边中点
  | 'middle-right'   // 右边中点
  | 'bottom-left'    // 左下角
  | 'bottom-center'  // 下边中点
  | 'bottom-right';  // 右下角

/**
 * 控制点信息
 * 描述单个控制点的位置和类型
 */
export interface HandleInfo {
  handle: ResizeHandle;  // 控制点类型
  x: number;             // X 坐标（世界坐标）
  y: number;             // Y 坐标（世界坐标）
}
