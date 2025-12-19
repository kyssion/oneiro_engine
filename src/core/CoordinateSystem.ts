import { Transform, ViewportBounds } from './types';

/**
 * CoordinateSystem - 坐标系渲染器
 * 
 * 负责渲染 X/Y 坐标轴、刻度和标签。
 * 根据缩放级别自动调整刻度间距，确保坐标始终清晰可读。
 * 
 * 主要特性：
 * - 自适应刻度：根据缩放级别调整刻度间距为整数（1, 2, 5, 10, 20...）
 * - 智能定位：当坐标轴不可见时，将刻度和标签显示在画布边缘
 * - 数字格式化：极大或极小的数字使用科学记数法
 * - 动态颜色：支持根据背景色调整坐标轴颜色
 */
export class CoordinateSystem {
  // 颜色配置
  private axisColor = 'rgba(100, 100, 100, 0.9)';   // 坐标轴主线颜色
  private tickColor = 'rgba(80, 80, 80, 0.8)';     // 刻度线颜色
  private labelColor = 'rgba(60, 60, 60, 1)';      // 数字标签颜色
  
  // 样式配置
  private axisWidth = 2;              // 坐标轴线宽（像素）
  private tickLength = 6;             // 刻度线长度（像素）
  private labelFont = '11px sans-serif';  // 标签字体
  private labelPadding = 4;           // 标签与坐标轴的间距

  /**
   * 根据缩放级别计算刻度间距
   * 确保刻度间距为整数（1, 2, 5, 10, 20, 50, 100...）
   * 
   * @param scale - 当前缩放比例
   * @returns 世界坐标中的刻度间距
   */
  private calculateTickSpacing(scale: number): number {
    const targetPixelSpacing = 80; // 目标刻度间距（80 像素）
    const worldSpacing = targetPixelSpacing / scale;  // 转换为世界坐标
    
    // 圆整为整数值（1, 2, 5, 10, 20, 50, 100, ...）
    const magnitude = Math.pow(10, Math.floor(Math.log10(worldSpacing)));  // 数量级
    const normalized = worldSpacing / magnitude;  // 归一化到 1-10 范围
    
    let niceNormalized: number;
    if (normalized < 1.5) {
      niceNormalized = 1;   // 1, 10, 100, 1000...
    } else if (normalized < 3) {
      niceNormalized = 2;   // 2, 20, 200, 2000...
    } else if (normalized < 7) {
      niceNormalized = 5;   // 5, 50, 500, 5000...
    } else {
      niceNormalized = 10;  // 10, 100, 1000...
    }
    
    return niceNormalized * magnitude;
  }

  /**
   * 格式化数字用于坐标轴显示
   * 小数和大数使用科学记数法，中等数值显示小数
   * 
   * @param value - 要格式化的数字
   * @returns 格式化后的字符串
   */
  private formatNumber(value: number): string {
    // 极小的数使用科学记数法
    if (Math.abs(value) < 0.0001 && value !== 0) {
      return value.toExponential(1);
    }
    // 极大的数使用科学记数法
    if (Math.abs(value) >= 10000) {
      return value.toExponential(1);
    }
    
    // 移除不必要的小数位
    const rounded = Math.round(value * 1000) / 1000;
    if (Math.abs(rounded) < 0.001) return '0';  // 接近零显示为 0
    return rounded.toString();
  }

  /**
   * 渲染坐标系
   * 绘制 X/Y 坐标轴、刻度线和数字标签
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
    const tickSpacing = this.calculateTickSpacing(transform.scale);
    
    // 计算原点在屏幕上的位置
    const originX = transform.offsetX;
    const originY = transform.offsetY;

    ctx.save();

    // 绘制坐标轴主线
    this.drawAxes(ctx, originX, originY, canvasSize);

    // 绘制刻度和标签
    this.drawXAxisTicks(ctx, transform, bounds, canvasSize, tickSpacing, originY);
    this.drawYAxisTicks(ctx, transform, bounds, canvasSize, tickSpacing, originX);

    // 绘制原点标签 (0, 0)
    this.drawOriginLabel(ctx, originX, originY, canvasSize);

    ctx.restore();
  }

  /**
   * 绘制主 X 和 Y 坐标轴
   * @param ctx - 绘图上下文
   * @param originX - 原点 X 坐标（屏幕）
   * @param originY - 原点 Y 坐标（屏幕）
   * @param canvasSize - 画布尺寸
   */
  private drawAxes(
    ctx: CanvasRenderingContext2D,
    originX: number,
    originY: number,
    canvasSize: { width: number; height: number }
  ): void {
    ctx.strokeStyle = this.axisColor;
    ctx.lineWidth = this.axisWidth;

    ctx.beginPath();

    // X 轴（仅当可见时绘制）
    if (originY >= 0 && originY <= canvasSize.height) {
      ctx.moveTo(0, originY);
      ctx.lineTo(canvasSize.width, originY);
    }

    // Y 轴（仅当可见时绘制）
    if (originX >= 0 && originX <= canvasSize.width) {
      ctx.moveTo(originX, 0);
      ctx.lineTo(originX, canvasSize.height);
    }

    ctx.stroke();
  }

  /**
   * 绘制 X 轴刻度和标签
   * 当 X 轴不可见时，将标签显示在画布顶部或底部
   * 
   * @param ctx - 绘图上下文
   * @param transform - 画布变换状态
   * @param bounds - 视口边界
   * @param canvasSize - 画布尺寸
   * @param tickSpacing - 刻度间距
   * @param originY - 原点 Y 坐标（屏幕）
   */
  private drawXAxisTicks(
    ctx: CanvasRenderingContext2D,
    transform: Transform,
    bounds: ViewportBounds,
    canvasSize: { width: number; height: number },
    tickSpacing: number,
    originY: number
  ): void {
    ctx.strokeStyle = this.tickColor;
    ctx.fillStyle = this.labelColor;
    ctx.font = this.labelFont;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.lineWidth = 1;

    // 计算需要绘制的刻度范围
    const startX = Math.floor(bounds.left / tickSpacing) * tickSpacing;
    const endX = Math.ceil(bounds.right / tickSpacing) * tickSpacing;

    // 根据 X 轴位置决定标签位置
    let labelY: number;   // 标签 Y 位置
    let tickY1: number;  // 刻度线起点
    let tickY2: number;  // 刻度线终点

    if (originY < 0) {
      // X 轴在视口上方 - 在顶部显示标签
      labelY = this.labelPadding;
      tickY1 = 0;
      tickY2 = this.tickLength;
    } else if (originY > canvasSize.height) {
      // X 轴在视口下方 - 在底部显示标签
      labelY = canvasSize.height - 15;
      tickY1 = canvasSize.height - this.tickLength;
      tickY2 = canvasSize.height;
      ctx.textBaseline = 'bottom';
    } else {
      // X 轴可见 - 在坐标轴旁显示标签
      labelY = originY + this.labelPadding;
      tickY1 = originY - this.tickLength / 2;
      tickY2 = originY + this.tickLength / 2;
    }

    ctx.beginPath();

    // 绘制刻度线
    for (let x = startX; x <= endX; x += tickSpacing) {
      if (Math.abs(x) < tickSpacing * 0.01) continue; // 跳过原点

      const screenX = x * transform.scale + transform.offsetX;
      
      if (screenX < 0 || screenX > canvasSize.width) continue;

      ctx.moveTo(screenX, tickY1);
      ctx.lineTo(screenX, tickY2);
    }

    ctx.stroke();

    // 绘制标签（单独循环以批量渲染文本）
    for (let x = startX; x <= endX; x += tickSpacing) {
      if (Math.abs(x) < tickSpacing * 0.01) continue;

      const screenX = x * transform.scale + transform.offsetX;
      
      // 避免标签超出画布边界
      if (screenX < 20 || screenX > canvasSize.width - 20) continue;

      ctx.fillText(this.formatNumber(x), screenX, labelY);
    }
  }

  /**
   * 绘制 Y 轴刻度和标签
   * 当 Y 轴不可见时，将标签显示在画布左侧或右侧
   * 
   * @param ctx - 绘图上下文
   * @param transform - 画布变换状态
   * @param bounds - 视口边界
   * @param canvasSize - 画布尺寸
   * @param tickSpacing - 刻度间距
   * @param originX - 原点 X 坐标（屏幕）
   */
  private drawYAxisTicks(
    ctx: CanvasRenderingContext2D,
    transform: Transform,
    bounds: ViewportBounds,
    canvasSize: { width: number; height: number },
    tickSpacing: number,
    originX: number
  ): void {
    ctx.strokeStyle = this.tickColor;
    ctx.fillStyle = this.labelColor;
    ctx.font = this.labelFont;
    ctx.textBaseline = 'middle';
    ctx.lineWidth = 1;

    // 计算需要绘制的刻度范围
    const startY = Math.floor(bounds.top / tickSpacing) * tickSpacing;
    const endY = Math.ceil(bounds.bottom / tickSpacing) * tickSpacing;

    // 根据 Y 轴位置决定标签位置
    let labelX: number;   // 标签 X 位置
    let tickX1: number;  // 刻度线起点
    let tickX2: number;  // 刻度线终点

    if (originX < 0) {
      // Y 轴在视口左侧 - 在左边显示标签
      labelX = this.labelPadding;
      tickX1 = 0;
      tickX2 = this.tickLength;
      ctx.textAlign = 'left';
    } else if (originX > canvasSize.width) {
      // Y 轴在视口右侧 - 在右边显示标签
      labelX = canvasSize.width - this.labelPadding;
      tickX1 = canvasSize.width - this.tickLength;
      tickX2 = canvasSize.width;
      ctx.textAlign = 'right';
    } else {
      // Y 轴可见 - 在坐标轴左侧显示标签
      labelX = originX - this.labelPadding;
      tickX1 = originX - this.tickLength / 2;
      tickX2 = originX + this.tickLength / 2;
      ctx.textAlign = 'right';
    }

    ctx.beginPath();

    // 绘制刻度线
    for (let y = startY; y <= endY; y += tickSpacing) {
      if (Math.abs(y) < tickSpacing * 0.01) continue; // 跳过原点

      const screenY = y * transform.scale + transform.offsetY;
      
      if (screenY < 0 || screenY > canvasSize.height) continue;

      ctx.moveTo(tickX1, screenY);
      ctx.lineTo(tickX2, screenY);
    }

    ctx.stroke();

    // 绘制标签
    for (let y = startY; y <= endY; y += tickSpacing) {
      if (Math.abs(y) < tickSpacing * 0.01) continue;

      const screenY = y * transform.scale + transform.offsetY;
      
      // 避免标签超出画布边界
      if (screenY < 15 || screenY > canvasSize.height - 15) continue;

      // 注意：Y 轴值是反转的（世界坐标中正数向上，屏幕坐标中正数向下）
      ctx.fillText(this.formatNumber(-y), labelX, screenY);
    }
  }

  /**
   * 绘制原点标签 (0, 0)
   * 仅当原点在可见区域时绘制
   * 
   * @param ctx - 绘图上下文
   * @param originX - 原点 X 坐标（屏幕）
   * @param originY - 原点 Y 坐标（屏幕）
   * @param canvasSize - 画布尺寸
   */
  private drawOriginLabel(
    ctx: CanvasRenderingContext2D,
    originX: number,
    originY: number,
    canvasSize: { width: number; height: number }
  ): void {
    // 仅当原点可见时绘制
    if (originX < -20 || originX > canvasSize.width + 20) return;
    if (originY < -20 || originY > canvasSize.height + 20) return;

    ctx.fillStyle = this.labelColor;
    ctx.font = 'bold 11px sans-serif';  // 原点标签使用粗体
    ctx.textAlign = 'right';
    ctx.textBaseline = 'top';

    // 确保标签不超出画布边界
    const labelX = Math.max(15, Math.min(originX - this.labelPadding, canvasSize.width - 15));
    const labelY = Math.max(0, Math.min(originY + this.labelPadding, canvasSize.height - 15));

    ctx.fillText('0', labelX, labelY);
  }

  // ==================== 公共 API ====================

  /**
   * 设置坐标系颜色
   * 用于根据背景色调整坐标轴颜色，确保可见性
   * 
   * @param axis - 坐标轴主线颜色
   * @param tick - 刻度线颜色
   * @param label - 数字标签颜色
   */
  public setColors(axis: string, tick: string, label: string): void {
    this.axisColor = axis;
    this.tickColor = tick;
    this.labelColor = label;
  }

  /**
   * 设置坐标轴线宽
   * @param width - 线宽（像素）
   */
  public setAxisWidth(width: number): void {
    this.axisWidth = width;
  }
}
