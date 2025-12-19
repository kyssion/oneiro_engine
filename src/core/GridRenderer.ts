import { Transform, GridConfig, GridPattern, ViewportBounds } from './types';

/**
 * GridRenderer - Renders grid or dot patterns with adaptive density
 * Automatically adjusts grid spacing based on zoom level for visual clarity
 */
export class GridRenderer {
  private config: GridConfig;

  constructor(config?: Partial<GridConfig>) {
    this.config = {
      pattern: 'grid',
      baseGridSize: 50,
      minGridSize: 10,
      maxGridSize: 200,
      gridColor: 'rgba(200, 200, 200, 0.8)',
      subGridColor: 'rgba(220, 220, 220, 0.5)',
      dotRadius: 1.5,
      ...config,
    };
  }

  /**
   * Calculate adaptive grid size based on zoom level
   * Uses a logarithmic scale to smoothly transition between grid densities
   */
  private calculateAdaptiveGridSize(scale: number): { mainSize: number; subSize: number; showSub: boolean } {
    const baseSize = this.config.baseGridSize;
    
    // Calculate the log2 of scale to determine grid level
    const logScale = Math.log2(scale);
    const gridLevel = Math.floor(logScale);
    
    // Calculate the fractional part for smooth transitions
    const fractional = logScale - gridLevel;
    
    // Main grid size adjusts inversely with zoom level
    let mainSize = baseSize * Math.pow(2, -gridLevel);
    
    // Clamp to reasonable bounds
    mainSize = Math.max(this.config.minGridSize, Math.min(this.config.maxGridSize, mainSize));
    
    // Sub-grid is always half the main grid
    const subSize = mainSize / 5;
    
    // Show sub-grid when zoomed in enough and fractional is in the right range
    const showSub = scale > 0.5 && fractional > -0.5;
    
    return { mainSize, subSize, showSub };
  }

  /**
   * Render the grid pattern (lines)
   */
  private renderGrid(
    ctx: CanvasRenderingContext2D,
    transform: Transform,
    bounds: ViewportBounds,
    canvasSize: { width: number; height: number }
  ): void {
    const { mainSize, subSize, showSub } = this.calculateAdaptiveGridSize(transform.scale);

    // Calculate visible grid lines
    const screenMainSize = mainSize * transform.scale;
    const screenSubSize = subSize * transform.scale;

    // Draw sub-grid first (behind main grid)
    if (showSub && screenSubSize > 5) {
      ctx.strokeStyle = this.config.subGridColor;
      ctx.lineWidth = 0.5;
      this.drawGridLines(ctx, transform, bounds, canvasSize, subSize);
    }

    // Draw main grid
    if (screenMainSize > 5) {
      ctx.strokeStyle = this.config.gridColor;
      ctx.lineWidth = 1;
      this.drawGridLines(ctx, transform, bounds, canvasSize, mainSize);
    }
  }

  /**
   * Draw grid lines at specified spacing
   */
  private drawGridLines(
    ctx: CanvasRenderingContext2D,
    transform: Transform,
    bounds: ViewportBounds,
    canvasSize: { width: number; height: number },
    spacing: number
  ): void {
    const startX = Math.floor(bounds.left / spacing) * spacing;
    const startY = Math.floor(bounds.top / spacing) * spacing;
    const endX = Math.ceil(bounds.right / spacing) * spacing;
    const endY = Math.ceil(bounds.bottom / spacing) * spacing;

    ctx.beginPath();

    // Vertical lines
    for (let x = startX; x <= endX; x += spacing) {
      const screenX = x * transform.scale + transform.offsetX;
      ctx.moveTo(screenX, 0);
      ctx.lineTo(screenX, canvasSize.height);
    }

    // Horizontal lines
    for (let y = startY; y <= endY; y += spacing) {
      const screenY = y * transform.scale + transform.offsetY;
      ctx.moveTo(0, screenY);
      ctx.lineTo(canvasSize.width, screenY);
    }

    ctx.stroke();
  }

  /**
   * Render dot pattern
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

    // Draw sub-dots first
    if (showSub && screenSubSize > 8) {
      ctx.fillStyle = this.config.subGridColor;
      this.drawDots(ctx, transform, bounds, subSize, this.config.dotRadius * 0.6);
    }

    // Draw main dots
    if (screenMainSize > 8) {
      ctx.fillStyle = this.config.gridColor;
      this.drawDots(ctx, transform, bounds, mainSize, this.config.dotRadius);
    }
  }

  /**
   * Draw dots at specified spacing
   */
  private drawDots(
    ctx: CanvasRenderingContext2D,
    transform: Transform,
    bounds: ViewportBounds,
    spacing: number,
    radius: number
  ): void {
    const startX = Math.floor(bounds.left / spacing) * spacing;
    const startY = Math.floor(bounds.top / spacing) * spacing;
    const endX = Math.ceil(bounds.right / spacing) * spacing;
    const endY = Math.ceil(bounds.bottom / spacing) * spacing;

    // Limit the number of dots to prevent performance issues
    const maxDots = 10000;
    const countX = (endX - startX) / spacing + 1;
    const countY = (endY - startY) / spacing + 1;
    
    if (countX * countY > maxDots) {
      return; // Skip if too many dots
    }

    ctx.beginPath();
    
    for (let x = startX; x <= endX; x += spacing) {
      for (let y = startY; y <= endY; y += spacing) {
        const screenX = x * transform.scale + transform.offsetX;
        const screenY = y * transform.scale + transform.offsetY;
        
        ctx.moveTo(screenX + radius, screenY);
        ctx.arc(screenX, screenY, radius, 0, Math.PI * 2);
      }
    }
    
    ctx.fill();
  }

  /**
   * Main render method - renders the appropriate pattern
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

  /**
   * Get current grid size info for external use
   */
  public getGridInfo(scale: number): { mainSize: number; subSize: number; showSub: boolean } {
    return this.calculateAdaptiveGridSize(scale);
  }

  // Public configuration methods
  public setPattern(pattern: GridPattern): void {
    this.config.pattern = pattern;
  }

  public getPattern(): GridPattern {
    return this.config.pattern;
  }

  public setGridColor(color: string): void {
    this.config.gridColor = color;
  }

  public setSubGridColor(color: string): void {
    this.config.subGridColor = color;
  }
}
