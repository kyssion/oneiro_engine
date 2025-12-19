import { Point, Transform, ShapeType, ShapeStyle } from './types';
import { Shape, Rectangle, Circle, Triangle } from './shapes';

/**
 * ShapeManager - Manages all shapes on the canvas
 * Handles creation, selection, rendering, and manipulation
 */
export class ShapeManager {
  private shapes: Shape[] = [];
  private selectedShape: Shape | null = null;
  
  // Current drawing state
  private currentShapeType: ShapeType = 'rectangle';
  private currentStyle: ShapeStyle = {
    fillColor: '#4a90d9',
    strokeColor: '#2a6bb8',
    strokeWidth: 2,
    opacity: 1,
  };

  // Event callbacks
  private onSelectionChange: ((shape: Shape | null) => void) | null = null;

  constructor() {}

  /**
   * Create a shape of the current type
   */
  public createShape(x: number, y: number, width: number, height: number): Shape {
    let shape: Shape;

    switch (this.currentShapeType) {
      case 'rectangle':
        shape = new Rectangle(x, y, width, height, { ...this.currentStyle });
        break;
      case 'circle':
        shape = new Circle(x, y, width, height, { ...this.currentStyle });
        break;
      case 'triangle':
        shape = new Triangle(x, y, width, height, { ...this.currentStyle });
        break;
      default:
        shape = new Rectangle(x, y, width, height, { ...this.currentStyle });
    }

    this.shapes.push(shape);
    return shape;
  }

  /**
   * Add an existing shape
   */
  public addShape(shape: Shape): void {
    this.shapes.push(shape);
  }

  /**
   * Remove a shape
   */
  public removeShape(shapeId: string): void {
    const index = this.shapes.findIndex(s => s.id === shapeId);
    if (index !== -1) {
      if (this.selectedShape?.id === shapeId) {
        this.deselectAll();
      }
      this.shapes.splice(index, 1);
    }
  }

  /**
   * Get shape at a world position
   */
  public getShapeAtPoint(worldPoint: Point): Shape | null {
    // Search from top to bottom (last added = on top)
    for (let i = this.shapes.length - 1; i >= 0; i--) {
      if (this.shapes[i].containsPoint(worldPoint)) {
        return this.shapes[i];
      }
    }
    return null;
  }

  /**
   * Select a shape
   */
  public selectShape(shape: Shape): void {
    this.deselectAll();
    shape.isSelected = true;
    this.selectedShape = shape;
    this.notifySelectionChange();
  }

  /**
   * Select shape by ID
   */
  public selectShapeById(shapeId: string): void {
    const shape = this.shapes.find(s => s.id === shapeId);
    if (shape) {
      this.selectShape(shape);
    }
  }

  /**
   * Deselect all shapes
   */
  public deselectAll(): void {
    this.shapes.forEach(s => s.isSelected = false);
    this.selectedShape = null;
    this.notifySelectionChange();
  }

  /**
   * Get currently selected shape
   */
  public getSelectedShape(): Shape | null {
    return this.selectedShape;
  }

  /**
   * Try to select at point
   */
  public trySelectAtPoint(worldPoint: Point): Shape | null {
    const shape = this.getShapeAtPoint(worldPoint);
    if (shape) {
      this.selectShape(shape);
      return shape;
    } else {
      this.deselectAll();
      return null;
    }
  }

  /**
   * Render all shapes
   */
  public render(ctx: CanvasRenderingContext2D, transform: Transform): void {
    // Render shapes in order (first added = bottom)
    this.shapes.forEach(shape => {
      shape.render(ctx, transform);
    });
  }

  /**
   * Get all shapes
   */
  public getShapes(): Shape[] {
    return [...this.shapes];
  }

  /**
   * Set current shape type for new shapes
   */
  public setShapeType(type: ShapeType): void {
    this.currentShapeType = type;
  }

  /**
   * Get current shape type
   */
  public getShapeType(): ShapeType {
    return this.currentShapeType;
  }

  /**
   * Set current style for new shapes
   */
  public setStyle(style: Partial<ShapeStyle>): void {
    this.currentStyle = { ...this.currentStyle, ...style };
  }

  /**
   * Get current style
   */
  public getStyle(): ShapeStyle {
    return { ...this.currentStyle };
  }

  /**
   * Apply style to selected shape
   */
  public applyStyleToSelected(style: Partial<ShapeStyle>): void {
    if (this.selectedShape) {
      this.selectedShape.setStyle(style);
    }
    // Also update current style for future shapes
    this.setStyle(style);
  }

  /**
   * Set selection change callback
   */
  public setOnSelectionChange(callback: (shape: Shape | null) => void): void {
    this.onSelectionChange = callback;
  }

  private notifySelectionChange(): void {
    if (this.onSelectionChange) {
      this.onSelectionChange(this.selectedShape);
    }
  }

  /**
   * Bring selected shape to front
   */
  public bringToFront(): void {
    if (!this.selectedShape) return;
    const index = this.shapes.indexOf(this.selectedShape);
    if (index !== -1 && index !== this.shapes.length - 1) {
      this.shapes.splice(index, 1);
      this.shapes.push(this.selectedShape);
    }
  }

  /**
   * Send selected shape to back
   */
  public sendToBack(): void {
    if (!this.selectedShape) return;
    const index = this.shapes.indexOf(this.selectedShape);
    if (index !== -1 && index !== 0) {
      this.shapes.splice(index, 1);
      this.shapes.unshift(this.selectedShape);
    }
  }

  /**
   * Delete selected shape
   */
  public deleteSelected(): void {
    if (this.selectedShape) {
      this.removeShape(this.selectedShape.id);
    }
  }

  /**
   * Clear all shapes
   */
  public clear(): void {
    this.shapes = [];
    this.selectedShape = null;
    this.notifySelectionChange();
  }
}
