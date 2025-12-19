import { Point, Transform, ShapeStyle,Shape } from '@/core';

/**
 * Circle - 圆形/椭圆类
 * 
 * 支持圆形和椭圆的绘制。
 * 当 width === height 时为正圆，否则为椭圆。
 * 点击检测使用椭圆方程。
 */
export class Circle extends Shape {
  /**
   * 构造函数
   * @param x - X 坐标（外接矩形左上角）
   * @param y - Y 坐标（外接矩形左上角）
   * @param width - 宽度（椭圆水平直径）
   * @param height - 高度（椭圆垂直直径）
   * @param style - 可选的样式
   */
  constructor(x: number, y: number, width: number, height: number, style?: Partial<ShapeStyle>) {
    super('circle', x, y, width, height, style);
  }

  /**
   * 椭圆中心 X 坐标
   */
  private get centerX(): number {
    return this.x + this.width / 2;
  }

  /**
   * 椭圆中心 Y 坐标
   */
  private get centerY(): number {
    return this.y + this.height / 2;
  }

  /**
   * 椭圆水平半径
   */
  private get radiusX(): number {
    return this.width / 2;
  }

  /**
   * 椭圆垂直半径
   */
  private get radiusY(): number {
    return this.height / 2;
  }

  /**
   * 检查点是否在椭圆内
   * 使用椭圆方程：(dx/rx)^2 + (dy/ry)^2 <= 1
   * 
   * @param point - 世界坐标中的点
   * @returns 点是否在椭圆内
   */
  public containsPoint(point: Point): boolean {
    // 计算归一化后的距离
    const dx = (point.x - this.centerX) / this.radiusX;
    const dy = (point.y - this.centerY) / this.radiusY;
    return (dx * dx + dy * dy) <= 1;
  }

  /**
   * 渲染椭圆
   * 使用 Canvas 的 ellipse 方法绘制
   * 
   * @param ctx - 绘图上下文
   * @param transform - 画布变换状态
   */
  public render(ctx: CanvasRenderingContext2D, transform: Transform): void {
    // 转换为屏幕坐标
    const screenCenterX = this.centerX * transform.scale + transform.offsetX;
    const screenCenterY = this.centerY * transform.scale + transform.offsetY;
    const screenRadiusX = this.radiusX * transform.scale;
    const screenRadiusY = this.radiusY * transform.scale;

    ctx.save();
    ctx.globalAlpha = this.style.opacity;  // 设置透明度

    // 绘制椭圆路径
    ctx.beginPath();
    ctx.ellipse(screenCenterX, screenCenterY, screenRadiusX, screenRadiusY, 0, 0, Math.PI * 2);

    // 绘制填充
    ctx.fillStyle = this.style.fillColor;
    ctx.fill();

    // 绘制描边
    ctx.strokeStyle = this.style.strokeColor;
    ctx.lineWidth = this.style.strokeWidth;
    ctx.stroke();

    ctx.restore();

    // 渲染选中控制点（如果被选中）
    this.renderHandles(ctx, transform);
  }
}
