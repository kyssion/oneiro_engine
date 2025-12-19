import './styles/main.css';
import { InfiniteCanvas, GridRenderer, CoordinateSystem, GridPattern } from './core';

/**
 * Main application entry point
 * Orchestrates the canvas, grid renderer, and coordinate system
 */
class App {
  private canvas: InfiniteCanvas;
  private gridRenderer: GridRenderer;
  private coordinateSystem: CoordinateSystem;
  private animationFrameId: number | null = null;

  // UI Elements
  private patternSelect: HTMLSelectElement;
  private zoomDisplay: HTMLSpanElement;
  private coordDisplay: HTMLSpanElement;
  private resetBtn: HTMLButtonElement;

  constructor() {
    // Get canvas element
    const canvasEl = document.getElementById('main-canvas') as HTMLCanvasElement;
    if (!canvasEl) {
      throw new Error('Canvas element not found');
    }

    // Initialize core components
    this.canvas = new InfiniteCanvas(canvasEl);
    this.gridRenderer = new GridRenderer();
    this.coordinateSystem = new CoordinateSystem();

    // Get UI elements
    this.patternSelect = document.getElementById('pattern-select') as HTMLSelectElement;
    this.zoomDisplay = document.getElementById('zoom-display') as HTMLSpanElement;
    this.coordDisplay = document.getElementById('coord-display') as HTMLSpanElement;
    this.resetBtn = document.getElementById('reset-btn') as HTMLButtonElement;

    this.setupEventListeners();
    this.canvas.resetView();
    this.startRenderLoop();
  }

  private setupEventListeners(): void {
    // Pattern selection
    this.patternSelect.addEventListener('change', (e) => {
      const pattern = (e.target as HTMLSelectElement).value as GridPattern;
      this.gridRenderer.setPattern(pattern);
    });

    // Reset button
    this.resetBtn.addEventListener('click', () => {
      this.canvas.resetView();
    });

    // Transform change listener
    this.canvas.setOnTransformChange((transform) => {
      const zoomPercent = (transform.scale * 100).toFixed(0);
      this.zoomDisplay.textContent = `${zoomPercent}%`;
    });

    // Mouse move listener for coordinates
    this.canvas.setOnMouseMove((worldPos) => {
      const x = worldPos.x.toFixed(1);
      const y = (-worldPos.y).toFixed(1); // Invert Y for standard math coordinates
      this.coordDisplay.textContent = `X: ${x}, Y: ${y}`;
    });
  }

  private render(): void {
    const ctx = this.canvas.getContext();
    const transform = this.canvas.getTransform();
    const bounds = this.canvas.getViewportBounds();
    const size = this.canvas.getCanvasSize();

    // Clear canvas
    this.canvas.clear();

    // Render layers
    this.gridRenderer.render(ctx, transform, bounds, size);
    this.coordinateSystem.render(ctx, transform, bounds, size);
  }

  private startRenderLoop(): void {
    const loop = () => {
      this.render();
      this.animationFrameId = requestAnimationFrame(loop);
    };
    loop();
  }

  public destroy(): void {
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
    }
  }
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  new App();
});
