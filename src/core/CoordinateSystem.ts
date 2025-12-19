import { Transform, ViewportBounds } from './types';

/**
 * CoordinateSystem - Renders X/Y axes with tick marks and labels
 * Automatically adjusts tick spacing based on zoom level
 */
export class CoordinateSystem {
  private axisColor = 'rgba(100, 100, 100, 0.9)';
  private tickColor = 'rgba(80, 80, 80, 0.8)';
  private labelColor = 'rgba(60, 60, 60, 1)';
  private axisWidth = 2;
  private tickLength = 6;
  private labelFont = '11px sans-serif';
  private labelPadding = 4;

  /**
   * Calculate tick spacing based on zoom level
   */
  private calculateTickSpacing(scale: number): number {
    const targetPixelSpacing = 80; // Target pixels between ticks
    const worldSpacing = targetPixelSpacing / scale;
    
    // Round to a nice number (1, 2, 5, 10, 20, 50, 100, etc.)
    const magnitude = Math.pow(10, Math.floor(Math.log10(worldSpacing)));
    const normalized = worldSpacing / magnitude;
    
    let niceNormalized: number;
    if (normalized < 1.5) {
      niceNormalized = 1;
    } else if (normalized < 3) {
      niceNormalized = 2;
    } else if (normalized < 7) {
      niceNormalized = 5;
    } else {
      niceNormalized = 10;
    }
    
    return niceNormalized * magnitude;
  }

  /**
   * Format number for display on axis
   */
  private formatNumber(value: number): string {
    if (Math.abs(value) < 0.0001 && value !== 0) {
      return value.toExponential(1);
    }
    if (Math.abs(value) >= 10000) {
      return value.toExponential(1);
    }
    
    // Remove unnecessary decimal places
    const rounded = Math.round(value * 1000) / 1000;
    if (Math.abs(rounded) < 0.001) return '0';
    return rounded.toString();
  }

  /**
   * Render the coordinate axes
   */
  public render(
    ctx: CanvasRenderingContext2D,
    transform: Transform,
    bounds: ViewportBounds,
    canvasSize: { width: number; height: number }
  ): void {
    const tickSpacing = this.calculateTickSpacing(transform.scale);
    
    // Calculate origin position on screen
    const originX = transform.offsetX;
    const originY = transform.offsetY;

    ctx.save();

    // Draw axes
    this.drawAxes(ctx, originX, originY, canvasSize);

    // Draw ticks and labels
    this.drawXAxisTicks(ctx, transform, bounds, canvasSize, tickSpacing, originY);
    this.drawYAxisTicks(ctx, transform, bounds, canvasSize, tickSpacing, originX);

    // Draw origin label
    this.drawOriginLabel(ctx, originX, originY, canvasSize);

    ctx.restore();
  }

  /**
   * Draw the main X and Y axes
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

    // X-axis (only if visible)
    if (originY >= 0 && originY <= canvasSize.height) {
      ctx.moveTo(0, originY);
      ctx.lineTo(canvasSize.width, originY);
    }

    // Y-axis (only if visible)
    if (originX >= 0 && originX <= canvasSize.width) {
      ctx.moveTo(originX, 0);
      ctx.lineTo(originX, canvasSize.height);
    }

    ctx.stroke();
  }

  /**
   * Draw X-axis ticks and labels
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

    const startX = Math.floor(bounds.left / tickSpacing) * tickSpacing;
    const endX = Math.ceil(bounds.right / tickSpacing) * tickSpacing;

    // Determine label Y position
    let labelY: number;
    let tickY1: number;
    let tickY2: number;

    if (originY < 0) {
      // Axis is above viewport
      labelY = this.labelPadding;
      tickY1 = 0;
      tickY2 = this.tickLength;
    } else if (originY > canvasSize.height) {
      // Axis is below viewport
      labelY = canvasSize.height - 15;
      tickY1 = canvasSize.height - this.tickLength;
      tickY2 = canvasSize.height;
      ctx.textBaseline = 'bottom';
    } else {
      // Axis is visible
      labelY = originY + this.labelPadding;
      tickY1 = originY - this.tickLength / 2;
      tickY2 = originY + this.tickLength / 2;
    }

    ctx.beginPath();

    for (let x = startX; x <= endX; x += tickSpacing) {
      if (Math.abs(x) < tickSpacing * 0.01) continue; // Skip origin

      const screenX = x * transform.scale + transform.offsetX;
      
      if (screenX < 0 || screenX > canvasSize.width) continue;

      // Draw tick
      ctx.moveTo(screenX, tickY1);
      ctx.lineTo(screenX, tickY2);
    }

    ctx.stroke();

    // Draw labels (separate loop to batch text rendering)
    for (let x = startX; x <= endX; x += tickSpacing) {
      if (Math.abs(x) < tickSpacing * 0.01) continue;

      const screenX = x * transform.scale + transform.offsetX;
      
      if (screenX < 20 || screenX > canvasSize.width - 20) continue;

      ctx.fillText(this.formatNumber(x), screenX, labelY);
    }
  }

  /**
   * Draw Y-axis ticks and labels
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

    const startY = Math.floor(bounds.top / tickSpacing) * tickSpacing;
    const endY = Math.ceil(bounds.bottom / tickSpacing) * tickSpacing;

    // Determine label X position
    let labelX: number;
    let tickX1: number;
    let tickX2: number;

    if (originX < 0) {
      // Axis is left of viewport
      labelX = this.labelPadding;
      tickX1 = 0;
      tickX2 = this.tickLength;
      ctx.textAlign = 'left';
    } else if (originX > canvasSize.width) {
      // Axis is right of viewport
      labelX = canvasSize.width - this.labelPadding;
      tickX1 = canvasSize.width - this.tickLength;
      tickX2 = canvasSize.width;
      ctx.textAlign = 'right';
    } else {
      // Axis is visible
      labelX = originX - this.labelPadding;
      tickX1 = originX - this.tickLength / 2;
      tickX2 = originX + this.tickLength / 2;
      ctx.textAlign = 'right';
    }

    ctx.beginPath();

    for (let y = startY; y <= endY; y += tickSpacing) {
      if (Math.abs(y) < tickSpacing * 0.01) continue; // Skip origin

      const screenY = y * transform.scale + transform.offsetY;
      
      if (screenY < 0 || screenY > canvasSize.height) continue;

      // Draw tick
      ctx.moveTo(tickX1, screenY);
      ctx.lineTo(tickX2, screenY);
    }

    ctx.stroke();

    // Draw labels
    for (let y = startY; y <= endY; y += tickSpacing) {
      if (Math.abs(y) < tickSpacing * 0.01) continue;

      const screenY = y * transform.scale + transform.offsetY;
      
      if (screenY < 15 || screenY > canvasSize.height - 15) continue;

      // Note: Y-axis values are inverted (positive up in world, but positive down in screen)
      ctx.fillText(this.formatNumber(-y), labelX, screenY);
    }
  }

  /**
   * Draw origin label
   */
  private drawOriginLabel(
    ctx: CanvasRenderingContext2D,
    originX: number,
    originY: number,
    canvasSize: { width: number; height: number }
  ): void {
    // Only draw if origin is visible
    if (originX < -20 || originX > canvasSize.width + 20) return;
    if (originY < -20 || originY > canvasSize.height + 20) return;

    ctx.fillStyle = this.labelColor;
    ctx.font = 'bold 11px sans-serif';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'top';

    const labelX = Math.max(15, Math.min(originX - this.labelPadding, canvasSize.width - 15));
    const labelY = Math.max(0, Math.min(originY + this.labelPadding, canvasSize.height - 15));

    ctx.fillText('0', labelX, labelY);
  }

  // Configuration methods
  public setColors(axis: string, tick: string, label: string): void {
    this.axisColor = axis;
    this.tickColor = tick;
    this.labelColor = label;
  }

  public setAxisWidth(width: number): void {
    this.axisWidth = width;
  }
}
