import { Transform, GridConfig, GridPattern, ViewportBounds } from '../types.ts';
import {RenderComponent} from "@/core/component/RenderComponent.ts";

/**
 * GridRenderer - 网格渲染器
 * 
 * 负责渲染自适应密度的网格或点状背景。
 * 根据缩放级别自动调整网格间距，保持视觉清晰度。
 * 
 * 主要特性：
 * - 自适应密度：根据缩放级别自动调整网格大小
 * - 主次网格：支持主网格和次网格两个层级
 * - 双模式：支持线条网格和点状网格两种样式
 * - 性能优化：仅绘制可见区域的网格，限制点数量
 */
export class GridRenderer extends RenderComponent{
  private config: GridConfig;  // 网格配置
  /**
   * 构造函数
   * @param config - 可选的网格配置
   */
  constructor(config?: Partial<GridConfig>) {
    super();
    this.config = {
      pattern: 'grid',                            // 默认使用线条网格
      baseGridSize: 50,                           // 基础网格大小 50 单位
      minGridSize: 10,                            // 最小网格 10 单位
      maxGridSize: 2000,                           // 最大网格 200 单位
      gridColor: 'rgba(200, 200, 200, 0.8)',     // 主网格颜色
      subGridColor: 'rgba(220, 220, 220, 0.5)',  // 次网格颜色（更淡）
      dotRadius: 1.5,                             // 点的半径
      NumberOfIntervals: 5,
      minInterValsSize: 5 , // 渲染的时候网格数量的最小要求

      mainLineWidth: 1,
      subLineWidth: 0.5,
      mainSizeNow: 0,
      subSizeNow: 0,
      ...config,  // 合并用户配置
    };
  }

  /**
   * 根据缩放级别计算自适应网格大小
   * 使用对数缩放算法，实现网格密度的平滑过渡
   * 
   * @param scale - 当前缩放比例
   * @returns 主网格大小、次网格大小、是否显示次网格
   */
  private calculateAdaptiveGridSize(scale: number): { mainSize: number; subSize: number; showSub: boolean } {
    const baseSize = this.config.baseGridSize;
    
    // 使用 log2 计算网格级别，实现 2 的幂次调整
    const logScale = Math.log2(scale);
    const gridLevel = Math.floor(logScale);
    // 主网格大小与缩放级别成反比
    let mainSize = baseSize * Math.pow(2, -gridLevel);

    // 计算小数部分，用于平滑过渡
    const fractional = logScale - gridLevel;
    
    // 限制在合理范围内
    mainSize = Math.max(this.config.minGridSize, Math.min(this.config.maxGridSize, mainSize));
    
    // 次网格始终为主网格的 1/NumberOfIntervals 数量
    const subSize = mainSize / this.config.NumberOfIntervals;
    
    // 当缩放大于 0.5 且小数部分在合适范围时显示次网格
    const showSub = scale > 0.1 && fractional > -0.1 || true; // todo 现在次网格永远显示
    this.config.mainSizeNow = mainSize;
    this.config.subSizeNow = subSize;
    return { mainSize, subSize, showSub };
  }

  /**
   * 渲染线条网格
   * @param ctx - 绘图上下文
   * @param transform - 画布变换状态
   * @param bounds - 视口边界（世界坐标）
   * @param canvasSize - 画布尺寸（像素）
   */
  private renderGrid(
    ctx: CanvasRenderingContext2D,
    transform: Transform,
    bounds: ViewportBounds,
    canvasSize: { width: number; height: number }
  ): void {
    const { mainSize, subSize, showSub } = this.calculateAdaptiveGridSize(transform.scale);

    // 计算网格在屏幕上的实际大小（像素）
    const screenMainSize = mainSize * transform.scale;
    const screenSubSize = subSize * transform.scale;

    // 先绘制次网格（在主网格之下） 当网格满足足够的数量的时候绘制
    if (showSub && screenSubSize > this.config.minInterValsSize) {
      ctx.strokeStyle = this.config.subGridColor;
      ctx.lineWidth = this.config.subLineWidth;  // 次网格线更细
      this.drawGridLines(ctx, transform, bounds, canvasSize, subSize);
    }

    // 绘制主网格
    if (screenMainSize > this.config.minInterValsSize) {  // 仅当网格满足足够的数量的时候绘制
      ctx.strokeStyle = this.config.gridColor;
      ctx.lineWidth = this.config.mainLineWidth;
      this.drawGridLines(ctx, transform, bounds, canvasSize, mainSize);
    }
  }

  /**
   * 绘制指定间距的网格线
   * @param ctx - 绘图上下文
   * @param transform - 画布变换状态
   * @param bounds - 视口边界
   * @param canvasSize - 画布尺寸
   * @param spacing - 网格间距（世界坐标单位）
   */
  private drawGridLines(
    ctx: CanvasRenderingContext2D,
    transform: Transform,
    bounds: ViewportBounds,
    canvasSize: { width: number; height: number },
    spacing: number
  ): void {
    // 计算需要绘制的网格线范围（对齐到网格）
    const startX = Math.floor(bounds.left / spacing) * spacing;
    const startY = Math.floor(bounds.top / spacing) * spacing;
    const endX = Math.ceil(bounds.right / spacing) * spacing;
    const endY = Math.ceil(bounds.bottom / spacing) * spacing;

    ctx.beginPath();

    // 绘制垂直线
    for (let x = startX; x <= endX; x += spacing) {
      const screenX = x * transform.scale + transform.offsetX;  // 世界坐标转屏幕坐标
      ctx.moveTo(screenX, 0);
      ctx.lineTo(screenX, canvasSize.height);
    }

    // 绘制水平线
    for (let y = startY; y <= endY; y += spacing) {
      const screenY = y * transform.scale + transform.offsetY;
      ctx.moveTo(0, screenY);
      ctx.lineTo(canvasSize.width, screenY);
    }

    ctx.stroke();  // 一次性绘制所有线，性能更好
  }

  /**
   * 渲染点状网格
   * @param ctx - 绘图上下文
   * @param transform - 画布变换状态
   * @param bounds - 视口边界
   * @param _canvasSize - 画布尺寸（未使用）
   */
  private renderDots(
    ctx: CanvasRenderingContext2D,
    transform: Transform,
    bounds: ViewportBounds,
    _canvasSize: { width: number; height: number }
  ): void {
    const { mainSize, subSize, showSub } = this.calculateAdaptiveGridSize(transform.scale);
    
    const screenMainSize = mainSize * transform.scale;
    const screenSubSize = subSize * transform.scale;

    // 先绘制次点（更小更淡）
    if (showSub && screenSubSize > 8) {
      ctx.fillStyle = this.config.subGridColor;
      this.drawDots(ctx, transform, bounds, subSize, this.config.dotRadius * 0.6);
    }

    // 绘制主点
    if (screenMainSize > 8) {
      ctx.fillStyle = this.config.gridColor;
      this.drawDots(ctx, transform, bounds, mainSize, this.config.dotRadius);
    }
  }

  /**
   * 绘制指定间距的点
   * @param ctx - 绘图上下文
   * @param transform - 画布变换状态
   * @param bounds - 视口边界
   * @param spacing - 点间距（世界坐标单位）
   * @param radius - 点的半径（像素）
   */
  private drawDots(
    ctx: CanvasRenderingContext2D,
    transform: Transform,
    bounds: ViewportBounds,
    spacing: number,
    radius: number
  ): void {
    // 计算需要绘制的点范围
    const startX = Math.floor(bounds.left / spacing) * spacing;
    const startY = Math.floor(bounds.top / spacing) * spacing;
    const endX = Math.ceil(bounds.right / spacing) * spacing;
    const endY = Math.ceil(bounds.bottom / spacing) * spacing;

    // 限制点数量防止性能问题
    const maxDots = 10000;
    const countX = (endX - startX) / spacing + 1;
    const countY = (endY - startY) / spacing + 1;
    
    if (countX * countY > maxDots) {
      return; // 点太多时跳过绘制
    }

    ctx.beginPath();
    
    // 使用嵌套循环绘制所有点
    for (let x = startX; x <= endX; x += spacing) {
      for (let y = startY; y <= endY; y += spacing) {
        const screenX = x * transform.scale + transform.offsetX;
        const screenY = y * transform.scale + transform.offsetY;
        
        // 绘制圆形点
        ctx.moveTo(screenX + radius, screenY);
        ctx.arc(screenX, screenY, radius, 0, Math.PI * 2);
      }
    }
    
    ctx.fill();  // 一次性填充所有点
  }

  /**
   * 主渲染方法
   * 根据配置选择渲染线条网格或点状网格
   * 
   * @param ctx - 绘图上下文
   * @param transform - 画布变换状态
   * @param bounds - 视口边界
   * @param canvasSize - 画布尺寸
   */
  public render(
    ctx: CanvasRenderingContext2D,
    transform: Transform,
    bounds: ViewportBounds,
    canvasSize: { width: number; height: number }
  ): void {
    if (this.config.pattern === 'grid') {
      this.renderGrid(ctx, transform, bounds, canvasSize);
    } else {
      this.renderDots(ctx, transform, bounds, canvasSize);
    }
  }

  // ==================== 公共 API ====================

  /**
   * 获取当前网格信息
   * 供外部使用，例如坐标系可以根据网格大小调整刻度间距
   * 
   * @param scale - 缩放比例
   * @returns 网格信息（主网格大小、次网格大小、是否显示次网格）
   */
  public getGridInfo(scale: number): { mainSize: number; subSize: number; showSub: boolean } {
    return this.calculateAdaptiveGridSize(scale);
  }

  /**
   * 设置网格模式
   * @param pattern - 网格模式（'grid' 或 'dots'）
   */
  public setPattern(pattern: GridPattern): void {
    this.config.pattern = pattern;
  }

  /**
   * 获取当前网格模式
   * @returns 当前模式
   */
  public getPattern(): GridPattern {
    return this.config.pattern;
  }

  /**
   * 设置主网格颜色
   * @param color - CSS 颜色值
   */
  public setGridColor(color: string): void {
    this.config.gridColor = color;
  }

  /**
   * 设置次网格颜色
   * @param color - CSS 颜色值
   */
  public setSubGridColor(color: string): void {
    this.config.subGridColor = color;
  }

  /**
   * 同时更新主次网格颜色
   * 用于主题切换或背景颜色变化时的批量更新
   * 
   * @param gridColor - 主网格颜色
   * @param subGridColor - 次网格颜色
   */
  public setColors(gridColor: string, subGridColor: string): void {
    this.config.gridColor = gridColor;
    this.config.subGridColor = subGridColor;
  }

  public getGirdSize(): [mainsize:number,subSize:number] {
    return [this.config.mainSizeNow,this.config.subSizeNow];
  }
}
