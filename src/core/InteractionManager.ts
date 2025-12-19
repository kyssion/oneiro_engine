import { Point, Transform, InteractionMode, ResizeHandle } from './types';
import { InfiniteCanvas } from './InfiniteCanvas';
import { ShapeManager } from './ShapeManager';
import { Shape } from './shapes';

/**
 * InteractionManager - Handles all canvas interactions
 * Manages modes: select, pan, draw
 * Handles shape selection, dragging, and resizing
 */
export class InteractionManager {
  private canvas: InfiniteCanvas;
  private shapeManager: ShapeManager;
  private canvasElement: HTMLCanvasElement;
  
  private mode: InteractionMode = 'select';
  
  // Interaction state
  private isDragging = false;
  private isResizing = false;
  private isDrawing = false;
  private isPanning = false;
  
  private dragStartWorld: Point = { x: 0, y: 0 };
  private dragStartScreen: Point = { x: 0, y: 0 };
  private activeHandle: ResizeHandle | null = null;
  private drawingShape: Shape | null = null;
  
  // Handle tolerance in world units
  private handleTolerance = 10;

  // Callbacks
  private onModeChange: ((mode: InteractionMode) => void) | null = null;
  private onInteractionStart: (() => void) | null = null;
  private onInteractionEnd: (() => void) | null = null;

  constructor(
    canvas: InfiniteCanvas,
    shapeManager: ShapeManager,
    canvasElement: HTMLCanvasElement
  ) {
    this.canvas = canvas;
    this.shapeManager = shapeManager;
    this.canvasElement = canvasElement;

    this.bindEvents();
  }

  private bindEvents(): void {
    this.canvasElement.addEventListener('mousedown', this.handleMouseDown.bind(this));
    this.canvasElement.addEventListener('mousemove', this.handleMouseMove.bind(this));
    this.canvasElement.addEventListener('mouseup', this.handleMouseUp.bind(this));
    this.canvasElement.addEventListener('mouseleave', this.handleMouseUp.bind(this));
    
    // Keyboard events for delete
    window.addEventListener('keydown', this.handleKeyDown.bind(this));
  }

  private getMousePosition(e: MouseEvent): { screen: Point; world: Point } {
    const rect = this.canvasElement.getBoundingClientRect();
    const screen = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
    const world = this.canvas.screenToWorld(screen);
    return { screen, world };
  }

  private handleMouseDown(e: MouseEvent): void {
    // Only handle left mouse button
    if (e.button !== 0) return;

    const { screen, world } = this.getMousePosition(e);
    this.dragStartWorld = world;
    this.dragStartScreen = screen;

    const transform = this.canvas.getTransform();
    this.handleTolerance = 10 / transform.scale;

    switch (this.mode) {
      case 'select':
        this.handleSelectMouseDown(world);
        break;
      case 'draw':
        this.handleDrawMouseDown(world);
        break;
      case 'pan':
        this.isPanning = true;
        break;
    }

    if (this.onInteractionStart) {
      this.onInteractionStart();
    }
  }

  private handleSelectMouseDown(world: Point): void {
    const selectedShape = this.shapeManager.getSelectedShape();
    
    // Check if clicking on a resize handle
    if (selectedShape) {
      const handle = selectedShape.getHandleAtPoint(world, this.handleTolerance);
      if (handle) {
        this.isResizing = true;
        this.activeHandle = handle;
        this.setCursor(handle);
        return;
      }
    }

    // Check if clicking on a shape
    const shape = this.shapeManager.getShapeAtPoint(world);
    if (shape) {
      this.shapeManager.selectShape(shape);
      this.isDragging = true;
      this.canvasElement.style.cursor = 'move';
    } else {
      // Clicked on empty space - deselect and enable panning
      this.shapeManager.deselectAll();
      this.isPanning = true;
    }
  }

  private handleDrawMouseDown(world: Point): void {
    this.isDrawing = true;
    // Create shape with minimal size - will resize as user drags
    this.drawingShape = this.shapeManager.createShape(
      world.x,
      world.y,
      1,
      1
    );
  }

  private handleMouseMove(e: MouseEvent): void {
    const { screen, world } = this.getMousePosition(e);
    
    if (this.isPanning) {
      // Let the InfiniteCanvas handle panning
      return;
    }

    if (this.isDragging) {
      this.handleDragMove(world);
      e.preventDefault();
      e.stopPropagation();
    } else if (this.isResizing) {
      this.handleResizeMove(world);
      e.preventDefault();
      e.stopPropagation();
    } else if (this.isDrawing && this.drawingShape) {
      this.handleDrawMove(world);
      e.preventDefault();
      e.stopPropagation();
    } else if (this.mode === 'select') {
      this.updateCursor(world);
    }
  }

  private handleDragMove(world: Point): void {
    const selectedShape = this.shapeManager.getSelectedShape();
    if (!selectedShape) return;

    const dx = world.x - this.dragStartWorld.x;
    const dy = world.y - this.dragStartWorld.y;

    selectedShape.move(dx, dy);
    this.dragStartWorld = world;
  }

  private handleResizeMove(world: Point): void {
    const selectedShape = this.shapeManager.getSelectedShape();
    if (!selectedShape || !this.activeHandle) return;

    const delta: Point = {
      x: world.x - this.dragStartWorld.x,
      y: world.y - this.dragStartWorld.y,
    };

    selectedShape.resizeByHandle(this.activeHandle, delta);
    this.dragStartWorld = world;
  }

  private handleDrawMove(world: Point): void {
    if (!this.drawingShape) return;

    // Calculate size from drag start
    let width = world.x - this.dragStartWorld.x;
    let height = world.y - this.dragStartWorld.y;

    // Handle negative dimensions (dragging up/left)
    let x = this.dragStartWorld.x;
    let y = this.dragStartWorld.y;

    if (width < 0) {
      x = world.x;
      width = -width;
    }
    if (height < 0) {
      y = world.y;
      height = -height;
    }

    this.drawingShape.setPosition(x, y);
    this.drawingShape.setSize(Math.max(10, width), Math.max(10, height));
  }

  private handleMouseUp(_e: MouseEvent): void {
    if (this.isDrawing && this.drawingShape) {
      // If shape is too small, remove it
      if (this.drawingShape.width < 10 || this.drawingShape.height < 10) {
        this.shapeManager.removeShape(this.drawingShape.id);
      } else {
        // Select the newly created shape
        this.shapeManager.selectShape(this.drawingShape);
        // Switch to select mode after drawing
        this.setMode('select');
      }
    }

    this.isDragging = false;
    this.isResizing = false;
    this.isDrawing = false;
    this.isPanning = false;
    this.activeHandle = null;
    this.drawingShape = null;

    this.updateCursorForMode();

    if (this.onInteractionEnd) {
      this.onInteractionEnd();
    }
  }

  private handleKeyDown(e: KeyboardEvent): void {
    // Delete selected shape
    if (e.key === 'Delete' || e.key === 'Backspace') {
      this.shapeManager.deleteSelected();
      e.preventDefault();
    }
    
    // Escape to deselect
    if (e.key === 'Escape') {
      this.shapeManager.deselectAll();
      this.setMode('select');
    }
  }

  private updateCursor(world: Point): void {
    const selectedShape = this.shapeManager.getSelectedShape();
    
    // Check resize handles first
    if (selectedShape) {
      const handle = selectedShape.getHandleAtPoint(world, this.handleTolerance);
      if (handle) {
        this.setCursor(handle);
        return;
      }
    }

    // Check if over any shape
    const shape = this.shapeManager.getShapeAtPoint(world);
    if (shape) {
      this.canvasElement.style.cursor = 'move';
    } else {
      this.canvasElement.style.cursor = 'default';
    }
  }

  private setCursor(handle: ResizeHandle): void {
    const cursors: Record<ResizeHandle, string> = {
      'top-left': 'nw-resize',
      'top-center': 'n-resize',
      'top-right': 'ne-resize',
      'middle-left': 'w-resize',
      'middle-right': 'e-resize',
      'bottom-left': 'sw-resize',
      'bottom-center': 's-resize',
      'bottom-right': 'se-resize',
    };
    this.canvasElement.style.cursor = cursors[handle];
  }

  private updateCursorForMode(): void {
    switch (this.mode) {
      case 'select':
        this.canvasElement.style.cursor = 'default';
        break;
      case 'draw':
        this.canvasElement.style.cursor = 'crosshair';
        break;
      case 'pan':
        this.canvasElement.style.cursor = 'grab';
        break;
    }
  }

  // Public API
  public setMode(mode: InteractionMode): void {
    this.mode = mode;
    // Update canvas pan mode
    this.canvas.setPanEnabled(mode === 'pan');
    this.updateCursorForMode();
    if (this.onModeChange) {
      this.onModeChange(mode);
    }
  }

  public getMode(): InteractionMode {
    return this.mode;
  }

  public setOnModeChange(callback: (mode: InteractionMode) => void): void {
    this.onModeChange = callback;
  }

  public setOnInteractionStart(callback: () => void): void {
    this.onInteractionStart = callback;
  }

  public setOnInteractionEnd(callback: () => void): void {
    this.onInteractionEnd = callback;
  }

  /**
   * Check if currently in an interaction that should block canvas panning
   */
  public isInteracting(): boolean {
    return this.isDragging || this.isResizing || this.isDrawing;
  }
}
