import { Point, Transform, ShapeStyle,Shape } from '@/core';

/**
 * Rectangle - 矩形类
 * 
 * 最简单的图形类型，绘制矩形。
 * 点击检测使用 AABB（轴对齐边界框）算法。
 */
export class Rectangle extends Shape {
  /**
   * 构造函数
   * @param x - X 坐标
   * @param y - Y 坐标
   * @param z - Z 层级
   * @param width - 宽度
   * @param height - 高度
   * @param style - 可选的样式
   */
  constructor(x: number, y: number,z:number, width: number, height: number, style?: Partial<ShapeStyle>) {
    super('rectangle', x, y,z, width, height, style);
  }

  /**
   * 检查点是否在矩形内
   * 使用简单的边界检查
   * 
   * @param point - 世界坐标中的点
   * @returns 点是否在矩形内
   */
  public containsPoint(point: Point): boolean {
    return (
      point.x >= this.x &&
      point.x <= this.x + this.width &&
      point.y >= this.y &&
      point.y <= this.y + this.height
    );
  }

  /**
   * 渲染矩形
   * 绘制填充和描边
   * 
   * @param ctx - 绘图上下文
   * @param transform - 画布变换状态
   */
  public render(ctx: CanvasRenderingContext2D, transform: Transform): void {
    // 转换为屏幕坐标
    const screenX = this.x * transform.scale + transform.offsetX;
    const screenY = this.y * transform.scale + transform.offsetY;
    const screenWidth = this.width * transform.scale;
    const screenHeight = this.height * transform.scale;

    ctx.save();
    ctx.globalAlpha = this.style.opacity;  // 设置透明度

    // 绘制填充
    ctx.fillStyle = this.style.fillColor;
    ctx.fillRect(screenX, screenY, screenWidth, screenHeight);

    // 绘制描边
    ctx.strokeStyle = this.style.strokeColor;
    ctx.lineWidth = this.style.strokeWidth;
    ctx.strokeRect(screenX, screenY, screenWidth, screenHeight);

    ctx.restore();

    // 渲染选中控制点（如果被选中）
    this.renderHandles(ctx, transform);
  }
}
