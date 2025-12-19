import { Point, Transform, ShapeStyle } from '../types';
import { Shape } from './Shape';

/**
 * Triangle shape (isosceles triangle pointing up)
 */
export class Triangle extends Shape {
  constructor(x: number, y: number, width: number, height: number, style?: Partial<ShapeStyle>) {
    super('triangle', x, y, width, height, style);
  }

  /**
   * Get the three vertices of the triangle in world coordinates
   */
  private getVertices(): Point[] {
    return [
      { x: this.x + this.width / 2, y: this.y }, // Top center
      { x: this.x, y: this.y + this.height }, // Bottom left
      { x: this.x + this.width, y: this.y + this.height }, // Bottom right
    ];
  }

  /**
   * Check if point is inside triangle using barycentric coordinates
   */
  public containsPoint(point: Point): boolean {
    const [p1, p2, p3] = this.getVertices();
    
    const sign = (p: Point, v1: Point, v2: Point): number => {
      return (p.x - v2.x) * (v1.y - v2.y) - (v1.x - v2.x) * (p.y - v2.y);
    };

    const d1 = sign(point, p1, p2);
    const d2 = sign(point, p2, p3);
    const d3 = sign(point, p3, p1);

    const hasNeg = (d1 < 0) || (d2 < 0) || (d3 < 0);
    const hasPos = (d1 > 0) || (d2 > 0) || (d3 > 0);

    return !(hasNeg && hasPos);
  }

  public render(ctx: CanvasRenderingContext2D, transform: Transform): void {
    const vertices = this.getVertices();
    const screenVertices = vertices.map(v => ({
      x: v.x * transform.scale + transform.offsetX,
      y: v.y * transform.scale + transform.offsetY,
    }));

    ctx.save();
    ctx.globalAlpha = this.style.opacity;

    ctx.beginPath();
    ctx.moveTo(screenVertices[0].x, screenVertices[0].y);
    ctx.lineTo(screenVertices[1].x, screenVertices[1].y);
    ctx.lineTo(screenVertices[2].x, screenVertices[2].y);
    ctx.closePath();

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
