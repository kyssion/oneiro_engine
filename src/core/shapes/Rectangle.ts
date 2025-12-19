import { Point, Transform, ShapeStyle } from '../types';
import { Shape } from './Shape';

/**
 * Rectangle shape
 */
export class Rectangle extends Shape {
  constructor(x: number, y: number, width: number, height: number, style?: Partial<ShapeStyle>) {
    super('rectangle', x, y, width, height, style);
  }

  public containsPoint(point: Point): boolean {
    return (
      point.x >= this.x &&
      point.x <= this.x + this.width &&
      point.y >= this.y &&
      point.y <= this.y + this.height
    );
  }

  public render(ctx: CanvasRenderingContext2D, transform: Transform): void {
    const screenX = this.x * transform.scale + transform.offsetX;
    const screenY = this.y * transform.scale + transform.offsetY;
    const screenWidth = this.width * transform.scale;
    const screenHeight = this.height * transform.scale;

    ctx.save();
    ctx.globalAlpha = this.style.opacity;

    // Fill
    ctx.fillStyle = this.style.fillColor;
    ctx.fillRect(screenX, screenY, screenWidth, screenHeight);

    // Stroke
    ctx.strokeStyle = this.style.strokeColor;
    ctx.lineWidth = this.style.strokeWidth;
    ctx.strokeRect(screenX, screenY, screenWidth, screenHeight);

    ctx.restore();

    // Render selection handles
    this.renderHandles(ctx, transform);
  }
}
