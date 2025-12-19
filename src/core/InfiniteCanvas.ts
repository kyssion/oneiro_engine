import { Point, Transform, CanvasConfig, ViewportBounds } from './types';

/**
 * InfiniteCanvas - Core class for infinite zoom/pan canvas
 * Handles all transformation, input events, and coordinate calculations
 */
export class InfiniteCanvas {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private config: CanvasConfig;
  
  private transform: Transform = {
    scale: 1,
    offsetX: 0,
    offsetY: 0,
  };

  private isDragging = false;
  private isPanEnabled = false; // External pan control
  private lastMousePos: Point = { x: 0, y: 0 };
  private currentMouseWorldPos: Point = { x: 0, y: 0 };

  private onTransformChange: ((transform: Transform) => void) | null = null;
  private onMouseMove: ((worldPos: Point) => void) | null = null;

  constructor(canvas: HTMLCanvasElement, config?: Partial<CanvasConfig>) {
    this.canvas = canvas;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('Failed to get 2D context');
    }
    this.ctx = ctx;

    this.config = {
      minScale: 0.01,
      maxScale: 100,
      zoomSensitivity: 0.001,
      ...config,
    };

    this.setupCanvas();
    this.bindEvents();
  }

  private setupCanvas(): void {
    this.resize();
    window.addEventListener('resize', () => this.resize());
  }

  private resize(): void {
    const container = this.canvas.parentElement;
    if (container) {
      const dpr = window.devicePixelRatio || 1;
      const rect = container.getBoundingClientRect();
      
      this.canvas.width = rect.width * dpr;
      this.canvas.height = rect.height * dpr;
      this.canvas.style.width = `${rect.width}px`;
      this.canvas.style.height = `${rect.height}px`;
      
      this.ctx.scale(dpr, dpr);
    }
    this.notifyTransformChange();
  }

  private bindEvents(): void {
    this.canvas.addEventListener('wheel', this.handleWheel.bind(this), { passive: false });
    this.canvas.addEventListener('mousedown', this.handleMouseDown.bind(this));
    this.canvas.addEventListener('mousemove', this.handleMouseMove.bind(this));
    this.canvas.addEventListener('mouseup', this.handleMouseUp.bind(this));
    this.canvas.addEventListener('mouseleave', this.handleMouseUp.bind(this));
    
    // Touch support
    this.canvas.addEventListener('touchstart', this.handleTouchStart.bind(this), { passive: false });
    this.canvas.addEventListener('touchmove', this.handleTouchMove.bind(this), { passive: false });
    this.canvas.addEventListener('touchend', this.handleTouchEnd.bind(this));
  }

  private handleWheel(e: WheelEvent): void {
    e.preventDefault();
    
    const rect = this.canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    // Calculate zoom
    const zoomFactor = Math.exp(-e.deltaY * this.config.zoomSensitivity);
    const newScale = Math.max(
      this.config.minScale,
      Math.min(this.config.maxScale, this.transform.scale * zoomFactor)
    );

    // Zoom towards mouse position
    const worldX = (mouseX - this.transform.offsetX) / this.transform.scale;
    const worldY = (mouseY - this.transform.offsetY) / this.transform.scale;

    this.transform.scale = newScale;
    this.transform.offsetX = mouseX - worldX * newScale;
    this.transform.offsetY = mouseY - worldY * newScale;

    this.notifyTransformChange();
  }

  private handleMouseDown(e: MouseEvent): void {
    // Only pan with middle mouse button or when pan mode is enabled
    if (e.button === 1 || (e.button === 0 && this.isPanEnabled)) {
      this.isDragging = true;
      this.lastMousePos = { x: e.clientX, y: e.clientY };
      this.canvas.style.cursor = 'grabbing';
    }
  }

  private handleMouseMove(e: MouseEvent): void {
    const rect = this.canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    // Update world position
    this.currentMouseWorldPos = this.screenToWorld({ x: mouseX, y: mouseY });
    if (this.onMouseMove) {
      this.onMouseMove(this.currentMouseWorldPos);
    }

    if (this.isDragging) {
      const dx = e.clientX - this.lastMousePos.x;
      const dy = e.clientY - this.lastMousePos.y;

      this.transform.offsetX += dx;
      this.transform.offsetY += dy;

      this.lastMousePos = { x: e.clientX, y: e.clientY };
      this.notifyTransformChange();
    }
  }

  private handleMouseUp(): void {
    this.isDragging = false;
    if (this.isPanEnabled) {
      this.canvas.style.cursor = 'grab';
    }
  }

  private lastTouchDistance = 0;
  private lastTouchCenter: Point = { x: 0, y: 0 };

  private handleTouchStart(e: TouchEvent): void {
    e.preventDefault();
    if (e.touches.length === 1) {
      this.isDragging = true;
      this.lastMousePos = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    } else if (e.touches.length === 2) {
      this.lastTouchDistance = this.getTouchDistance(e.touches);
      this.lastTouchCenter = this.getTouchCenter(e.touches);
    }
  }

  private handleTouchMove(e: TouchEvent): void {
    e.preventDefault();
    if (e.touches.length === 1 && this.isDragging) {
      const dx = e.touches[0].clientX - this.lastMousePos.x;
      const dy = e.touches[0].clientY - this.lastMousePos.y;

      this.transform.offsetX += dx;
      this.transform.offsetY += dy;

      this.lastMousePos = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      this.notifyTransformChange();
    } else if (e.touches.length === 2) {
      const distance = this.getTouchDistance(e.touches);
      const center = this.getTouchCenter(e.touches);
      
      const zoomFactor = distance / this.lastTouchDistance;
      const newScale = Math.max(
        this.config.minScale,
        Math.min(this.config.maxScale, this.transform.scale * zoomFactor)
      );

      const rect = this.canvas.getBoundingClientRect();
      const centerX = center.x - rect.left;
      const centerY = center.y - rect.top;

      const worldX = (centerX - this.transform.offsetX) / this.transform.scale;
      const worldY = (centerY - this.transform.offsetY) / this.transform.scale;

      this.transform.scale = newScale;
      this.transform.offsetX = centerX - worldX * newScale;
      this.transform.offsetY = centerY - worldY * newScale;

      // Pan
      this.transform.offsetX += center.x - this.lastTouchCenter.x;
      this.transform.offsetY += center.y - this.lastTouchCenter.y;

      this.lastTouchDistance = distance;
      this.lastTouchCenter = center;
      this.notifyTransformChange();
    }
  }

  private handleTouchEnd(): void {
    this.isDragging = false;
  }

  private getTouchDistance(touches: TouchList): number {
    const dx = touches[0].clientX - touches[1].clientX;
    const dy = touches[0].clientY - touches[1].clientY;
    return Math.sqrt(dx * dx + dy * dy);
  }

  private getTouchCenter(touches: TouchList): Point {
    return {
      x: (touches[0].clientX + touches[1].clientX) / 2,
      y: (touches[0].clientY + touches[1].clientY) / 2,
    };
  }

  private notifyTransformChange(): void {
    if (this.onTransformChange) {
      this.onTransformChange({ ...this.transform });
    }
  }

  // Public API
  public screenToWorld(screenPos: Point): Point {
    return {
      x: (screenPos.x - this.transform.offsetX) / this.transform.scale,
      y: (screenPos.y - this.transform.offsetY) / this.transform.scale,
    };
  }

  public worldToScreen(worldPos: Point): Point {
    return {
      x: worldPos.x * this.transform.scale + this.transform.offsetX,
      y: worldPos.y * this.transform.scale + this.transform.offsetY,
    };
  }

  public getTransform(): Transform {
    return { ...this.transform };
  }

  public getViewportBounds(): ViewportBounds {
    const rect = this.canvas.getBoundingClientRect();
    const topLeft = this.screenToWorld({ x: 0, y: 0 });
    const bottomRight = this.screenToWorld({ x: rect.width, y: rect.height });
    
    return {
      left: topLeft.x,
      top: topLeft.y,
      right: bottomRight.x,
      bottom: bottomRight.y,
      width: bottomRight.x - topLeft.x,
      height: bottomRight.y - topLeft.y,
    };
  }

  public getContext(): CanvasRenderingContext2D {
    return this.ctx;
  }

  public getCanvasSize(): { width: number; height: number } {
    const rect = this.canvas.getBoundingClientRect();
    return { width: rect.width, height: rect.height };
  }

  public setOnTransformChange(callback: (transform: Transform) => void): void {
    this.onTransformChange = callback;
  }

  public setOnMouseMove(callback: (worldPos: Point) => void): void {
    this.onMouseMove = callback;
  }

  public resetView(): void {
    this.transform = { scale: 1, offsetX: 0, offsetY: 0 };
    const size = this.getCanvasSize();
    this.transform.offsetX = size.width / 2;
    this.transform.offsetY = size.height / 2;
    this.notifyTransformChange();
  }

  public clear(): void {
    const size = this.getCanvasSize();
    this.ctx.clearRect(0, 0, size.width, size.height);
  }

  public setPanEnabled(enabled: boolean): void {
    this.isPanEnabled = enabled;
    if (enabled) {
      this.canvas.style.cursor = 'grab';
    }
  }

  public getPanEnabled(): boolean {
    return this.isPanEnabled;
  }
}
