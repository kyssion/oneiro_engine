import { Point, Transform, ShapeStyle ,Shape} from '@/core';

/**
 * Triangle - 三角形类（等腰三角形，顶点向上）
 * 
 * 绘制等腰三角形，顶点在上边中点，底边为矩形的底边。
 * 点击检测使用重心坐标法（Barycentric Coordinates）。
 */
export class Triangle extends Shape {
  /**
   * 构造函数
   * @param x - X 坐标（外接矩形左上角）
   * @param y - Y 坐标（外接矩形左上角）
   * @param z - Z 层级
   * @param width - 宽度（底边宽度）
   * @param height - 高度（三角形高度）
   * @param style - 可选的样式
   */
  constructor(x: number, y: number,z:number, width: number, height: number, style?: Partial<ShapeStyle>) {
    super('triangle', x, y,z, width, height, style);
  }

  /**
   * 获取三角形的三个顶点（世界坐标）
   * @returns 三个顶点的坐标数组
   */
  private getVertices(): Point[] {
    return [
      { x: this.x + this.width / 2, y: this.y },          // 顶点（上边中点）
      { x: this.x, y: this.y + this.height },             // 左下角
      { x: this.x + this.width, y: this.y + this.height }, // 右下角
    ];
  }

  /**
   * 检查点是否在三角形内
   * 使用重心坐标法（Barycentric Coordinates）进行判断
   * 
   * @param point - 世界坐标中的点
   * @returns 点是否在三角形内
   */
  public containsPoint(point: Point): boolean {
    const [p1, p2, p3] = this.getVertices();
    
    // 计算点相对于三角形边的位置
    const sign = (p: Point, v1: Point, v2: Point): number => {
      return (p.x - v2.x) * (v1.y - v2.y) - (v1.x - v2.x) * (p.y - v2.y);
    };

    const d1 = sign(point, p1, p2);
    const d2 = sign(point, p2, p3);
    const d3 = sign(point, p3, p1);

    // 如果所有符号相同，则点在三角形内
    const hasNeg = (d1 < 0) || (d2 < 0) || (d3 < 0);
    const hasPos = (d1 > 0) || (d2 > 0) || (d3 > 0);

    return !(hasNeg && hasPos);
  }

  /**
   * 渲染三角形
   * 使用三个顶点绘制封闭路径
   * 
   * @param ctx - 绘图上下文
   * @param transform - 画布变换状态
   */
  public render(ctx: CanvasRenderingContext2D, transform: Transform): void {
    const vertices = this.getVertices();
    // 将顶点转换为屏幕坐标
    const screenVertices = vertices.map(v => ({
      x: v.x * transform.scale + transform.offsetX,
      y: v.y * transform.scale + transform.offsetY,
    }));

    ctx.save();
    ctx.globalAlpha = this.style.opacity;  // 设置透明度

    // 绘制三角形路径
    ctx.beginPath();
    ctx.moveTo(screenVertices[0].x, screenVertices[0].y);  // 移动到顶点
    ctx.lineTo(screenVertices[1].x, screenVertices[1].y);  // 连接到左下角
    ctx.lineTo(screenVertices[2].x, screenVertices[2].y);  // 连接到右下角
    ctx.closePath();  // 封闭路径（连接回顶点）

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
