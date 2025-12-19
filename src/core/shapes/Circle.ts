import { Point, Transform, ShapeStyle,Shape } from '@/core';

/**
 * Circle/Ellipse shape
 */
export class Circle extends Shape {
  constructor(x: number, y: number, width: number, height: number, style?: Partial<ShapeStyle>) {
    super('circle', x, y, width, height, style);
  }

  private get centerX(): number {
    return this.x + this.width / 2;
  }

  private get centerY(): number {
    return this.y + this.height / 2;
  }

  private get radiusX(): number {
    return this.width / 2;
  }

  private get radiusY(): number {
    return this.height / 2;
  }

  public containsPoint(point: Point): boolean {
    // Check if point is inside ellipse
    const dx = (point.x - this.centerX) / this.radiusX;
    const dy = (point.y - this.centerY) / this.radiusY;
    return (dx * dx + dy * dy) <= 1;
  }

  public render(ctx: CanvasRenderingContext2D, transform: Transform): void {
    const screenCenterX = this.centerX * transform.scale + transform.offsetX;
    const screenCenterY = this.centerY * transform.scale + transform.offsetY;
    const screenRadiusX = this.radiusX * transform.scale;
    const screenRadiusY = this.radiusY * transform.scale;

    ctx.save();
    ctx.globalAlpha = this.style.opacity;

    ctx.beginPath();
    ctx.ellipse(screenCenterX, screenCenterY, screenRadiusX, screenRadiusY, 0, 0, Math.PI * 2);

    // Fill
    ctx.fillStyle = this.style.fillColor;
    ctx.fill();

    // Stroke
    ctx.strokeStyle = this.style.strokeColor;
    ctx.lineWidth = this.style.strokeWidth;
    ctx.stroke();

    ctx.restore();

    // Render selection handles
    this.renderHandles(ctx, transform);
  }
}
