import './styles/main.css';
import { 
  InfiniteCanvas, 
  GridRenderer, 
  CoordinateSystem, 
  ShapeManager,
  InteractionManager,
  GridPattern,
  ShapeType,
  InteractionMode
} from './core';

/**
 * Main application entry point
 * Orchestrates all canvas components and UI interactions
 */
class App {
  private canvas: InfiniteCanvas;
  private gridRenderer: GridRenderer;
  private coordinateSystem: CoordinateSystem;
  private shapeManager: ShapeManager;
  private interactionManager: InteractionManager;
  private animationFrameId: number | null = null;
  private canvasElement: HTMLCanvasElement;

  // UI Elements
  private patternSelect!: HTMLSelectElement;
  private zoomDisplay!: HTMLSpanElement;
  private coordDisplay!: HTMLSpanElement;
  private modeDisplay!: HTMLSpanElement;
  private resetBtn!: HTMLButtonElement;
  private deleteBtn!: HTMLButtonElement;
  
  // Tool buttons
  private toolSelectBtn!: HTMLButtonElement;
  private toolPanBtn!: HTMLButtonElement;
  private shapeRectBtn!: HTMLButtonElement;
  private shapeCircleBtn!: HTMLButtonElement;
  private shapeTriangleBtn!: HTMLButtonElement;
  
  // Color inputs
  private fillColorInput!: HTMLInputElement;
  private strokeColorInput!: HTMLInputElement;
  private fillColorLabel!: HTMLSpanElement;
  private strokeColorLabel!: HTMLSpanElement;

  constructor() {
    // Get canvas element
    this.canvasElement = document.getElementById('main-canvas') as HTMLCanvasElement;
    if (!this.canvasElement) {
      throw new Error('Canvas element not found');
    }

    // Initialize core components
    this.canvas = new InfiniteCanvas(this.canvasElement);
    this.gridRenderer = new GridRenderer();
    this.coordinateSystem = new CoordinateSystem();
    this.shapeManager = new ShapeManager();
    this.interactionManager = new InteractionManager(
      this.canvas,
      this.shapeManager,
      this.canvasElement
    );

    this.getUIElements();
    this.setupEventListeners();
    this.canvas.resetView();
    this.startRenderLoop();
  }

  private getUIElements(): void {
    // View controls
    this.patternSelect = document.getElementById('pattern-select') as HTMLSelectElement;
    this.zoomDisplay = document.getElementById('zoom-display') as HTMLSpanElement;
    this.coordDisplay = document.getElementById('coord-display') as HTMLSpanElement;
    this.modeDisplay = document.getElementById('mode-display') as HTMLSpanElement;
    this.resetBtn = document.getElementById('reset-btn') as HTMLButtonElement;
    this.deleteBtn = document.getElementById('delete-btn') as HTMLButtonElement;
    
    // Tool buttons
    this.toolSelectBtn = document.getElementById('tool-select') as HTMLButtonElement;
    this.toolPanBtn = document.getElementById('tool-pan') as HTMLButtonElement;
    this.shapeRectBtn = document.getElementById('shape-rect') as HTMLButtonElement;
    this.shapeCircleBtn = document.getElementById('shape-circle') as HTMLButtonElement;
    this.shapeTriangleBtn = document.getElementById('shape-triangle') as HTMLButtonElement;
    
    // Color inputs
    this.fillColorInput = document.getElementById('fill-color') as HTMLInputElement;
    this.strokeColorInput = document.getElementById('stroke-color') as HTMLInputElement;
    this.fillColorLabel = document.getElementById('fill-color-label') as HTMLSpanElement;
    this.strokeColorLabel = document.getElementById('stroke-color-label') as HTMLSpanElement;
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

    // Delete button
    this.deleteBtn.addEventListener('click', () => {
      this.shapeManager.deleteSelected();
    });

    // Tool buttons
    this.toolSelectBtn.addEventListener('click', () => {
      this.setMode('select');
    });

    this.toolPanBtn.addEventListener('click', () => {
      this.setMode('pan');
    });

    // Shape buttons
    this.shapeRectBtn.addEventListener('click', () => {
      this.setDrawMode('rectangle');
    });

    this.shapeCircleBtn.addEventListener('click', () => {
      this.setDrawMode('circle');
    });

    this.shapeTriangleBtn.addEventListener('click', () => {
      this.setDrawMode('triangle');
    });

    // Color inputs
    this.fillColorInput.addEventListener('input', (e) => {
      const color = (e.target as HTMLInputElement).value;
      this.fillColorLabel.textContent = color;
      this.shapeManager.applyStyleToSelected({ fillColor: color });
    });

    this.strokeColorInput.addEventListener('input', (e) => {
      const color = (e.target as HTMLInputElement).value;
      this.strokeColorLabel.textContent = color;
      this.shapeManager.applyStyleToSelected({ strokeColor: color });
    });

    // Transform change listener
    this.canvas.setOnTransformChange((transform) => {
      const zoomPercent = (transform.scale * 100).toFixed(0);
      this.zoomDisplay.textContent = `${zoomPercent}%`;
    });

    // Mouse move listener for coordinates
    this.canvas.setOnMouseMove((worldPos) => {
      const x = worldPos.x.toFixed(1);
      const y = (-worldPos.y).toFixed(1);
      this.coordDisplay.textContent = `X: ${x}, Y: ${y}`;
    });

    // Mode change listener
    this.interactionManager.setOnModeChange((mode) => {
      this.updateModeUI(mode);
    });

    // Selection change listener
    this.shapeManager.setOnSelectionChange((shape) => {
      if (shape) {
        // Update color inputs to match selected shape
        this.fillColorInput.value = shape.style.fillColor;
        this.strokeColorInput.value = shape.style.strokeColor;
        this.fillColorLabel.textContent = shape.style.fillColor;
        this.strokeColorLabel.textContent = shape.style.strokeColor;
      }
    });

    // Keyboard shortcuts
    window.addEventListener('keydown', (e) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLSelectElement) {
        return; // Don't handle shortcuts when typing in inputs
      }
      
      switch (e.key.toLowerCase()) {
        case 'v':
          this.setMode('select');
          break;
        case 'h':
          this.setMode('pan');
          break;
        case 'r':
          this.setDrawMode('rectangle');
          break;
        case 'c':
          this.setDrawMode('circle');
          break;
        case 't':
          this.setDrawMode('triangle');
          break;
      }
    });
  }

  private setMode(mode: InteractionMode): void {
    this.interactionManager.setMode(mode);
    this.updateModeUI(mode);
  }

  private setDrawMode(shapeType: ShapeType): void {
    this.shapeManager.setShapeType(shapeType);
    this.interactionManager.setMode('draw');
    this.updateModeUI('draw', shapeType);
  }

  private updateModeUI(mode: InteractionMode, shapeType?: ShapeType): void {
    // Clear all active states
    this.toolSelectBtn.classList.remove('active');
    this.toolPanBtn.classList.remove('active');
    this.shapeRectBtn.classList.remove('active');
    this.shapeCircleBtn.classList.remove('active');
    this.shapeTriangleBtn.classList.remove('active');

    // Set active state based on mode
    switch (mode) {
      case 'select':
        this.toolSelectBtn.classList.add('active');
        this.modeDisplay.textContent = 'Select Mode';
        break;
      case 'pan':
        this.toolPanBtn.classList.add('active');
        this.modeDisplay.textContent = 'Pan Mode';
        break;
      case 'draw':
        const type = shapeType || this.shapeManager.getShapeType();
        switch (type) {
          case 'rectangle':
            this.shapeRectBtn.classList.add('active');
            this.modeDisplay.textContent = 'Draw Rectangle';
            break;
          case 'circle':
            this.shapeCircleBtn.classList.add('active');
            this.modeDisplay.textContent = 'Draw Circle';
            break;
          case 'triangle':
            this.shapeTriangleBtn.classList.add('active');
            this.modeDisplay.textContent = 'Draw Triangle';
            break;
        }
        break;
    }
  }

  private render(): void {
    const ctx = this.canvas.getContext();
    const transform = this.canvas.getTransform();
    const bounds = this.canvas.getViewportBounds();
    const size = this.canvas.getCanvasSize();

    // Clear canvas
    this.canvas.clear();

    // Render layers in order
    this.gridRenderer.render(ctx, transform, bounds, size);
    this.coordinateSystem.render(ctx, transform, bounds, size);
    this.shapeManager.render(ctx, transform);
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
