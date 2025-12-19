import { Point, Transform, BoundingBox, ShapeStyle, ShapeType, ShapeData, ResizeHandle, HandleInfo } from './types';

/**
 * Generate unique ID for shapes
 */
export function generateId(): string {
  return `shape_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Base Shape class - abstract class for all shapes
 */
export abstract class Shape {
  public id: string;
  public type: ShapeType;
  
  // Position and dimensions in world coordinates
  public x: number;
  public y: number;
  public width: number;
  public height: number;
  public rotation: number = 0;
  
  // Style
  public style: ShapeStyle;
  
  // Selection state
  public isSelected: boolean = false;

  constructor(type: ShapeType, x: number, y: number, width: number, height: number, style?: Partial<ShapeStyle>) {
    this.id = generateId();
    this.type = type;
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.style = {
      fillColor: '#4a90d9',
      strokeColor: '#2a6bb8',
      strokeWidth: 2,
      opacity: 1,
      ...style,
    };
  }

  /**
   * Get bounding box in world coordinates
   */
  public getBoundingBox(): BoundingBox {
    return {
      x: this.x,
      y: this.y,
      width: this.width,
      height: this.height,
    };
  }

  /**
   * Check if a point (in world coordinates) is inside this shape
   */
  public abstract containsPoint(point: Point): boolean;

  /**
   * Render the shape to the canvas
   */
  public abstract render(ctx: CanvasRenderingContext2D, transform: Transform): void;

  /**
   * Move the shape by delta
   */
  public move(dx: number, dy: number): void {
    this.x += dx;
    this.y += dy;
  }

  /**
   * Set position
   */
  public setPosition(x: number, y: number): void {
    this.x = x;
    this.y = y;
  }

  /**
   * Set size
   */
  public setSize(width: number, height: number): void {
    this.width = Math.max(10, width);
    this.height = Math.max(10, height);
  }

  /**
   * Get resize handle positions in world coordinates
   */
  public getHandles(): HandleInfo[] {
    const { x, y, width, height } = this;
    const handles: HandleInfo[] = [
      { handle: 'top-left', x: x, y: y },
      { handle: 'top-center', x: x + width / 2, y: y },
      { handle: 'top-right', x: x + width, y: y },
      { handle: 'middle-left', x: x, y: y + height / 2 },
      { handle: 'middle-right', x: x + width, y: y + height / 2 },
      { handle: 'bottom-left', x: x, y: y + height },
      { handle: 'bottom-center', x: x + width / 2, y: y + height },
      { handle: 'bottom-right', x: x + width, y: y + height },
    ];
    return handles;
  }

  /**
   * Resize based on handle being dragged
   */
  public resizeByHandle(handle: ResizeHandle, worldDelta: Point): void {
    switch (handle) {
      case 'top-left':
        this.x += worldDelta.x;
        this.y += worldDelta.y;
        this.width -= worldDelta.x;
        this.height -= worldDelta.y;
        break;
      case 'top-center':
        this.y += worldDelta.y;
        this.height -= worldDelta.y;
        break;
      case 'top-right':
        this.y += worldDelta.y;
        this.width += worldDelta.x;
        this.height -= worldDelta.y;
        break;
      case 'middle-left':
        this.x += worldDelta.x;
        this.width -= worldDelta.x;
        break;
      case 'middle-right':
        this.width += worldDelta.x;
        break;
      case 'bottom-left':
        this.x += worldDelta.x;
        this.width -= worldDelta.x;
        this.height += worldDelta.y;
        break;
      case 'bottom-center':
        this.height += worldDelta.y;
        break;
      case 'bottom-right':
        this.width += worldDelta.x;
        this.height += worldDelta.y;
        break;
    }
    
    // Ensure minimum size
    if (this.width < 10) {
      if (handle.includes('left')) this.x -= (10 - this.width);
      this.width = 10;
    }
    if (this.height < 10) {
      if (handle.includes('top')) this.y -= (10 - this.height);
      this.height = 10;
    }
  }

  /**
   * Render selection handles
   */
  public renderHandles(ctx: CanvasRenderingContext2D, transform: Transform): void {
    if (!this.isSelected) return;

    const handleSize = 8;
    const handles = this.getHandles();

    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = '#4a90d9';
    ctx.lineWidth = 2;

    handles.forEach(({ x, y }) => {
      const screenX = x * transform.scale + transform.offsetX;
      const screenY = y * transform.scale + transform.offsetY;
      
      ctx.beginPath();
      ctx.rect(screenX - handleSize / 2, screenY - handleSize / 2, handleSize, handleSize);
      ctx.fill();
      ctx.stroke();
    });

    // Draw bounding box
    const bbox = this.getBoundingBox();
    const screenX = bbox.x * transform.scale + transform.offsetX;
    const screenY = bbox.y * transform.scale + transform.offsetY;
    const screenWidth = bbox.width * transform.scale;
    const screenHeight = bbox.height * transform.scale;

    ctx.strokeStyle = '#4a90d9';
    ctx.lineWidth = 1;
    ctx.setLineDash([5, 5]);
    ctx.strokeRect(screenX, screenY, screenWidth, screenHeight);
    ctx.setLineDash([]);
  }

  /**
   * Check if a point is on a resize handle
   */
  public getHandleAtPoint(worldPoint: Point, tolerance: number): ResizeHandle | null {
    const handles = this.getHandles();
    
    for (const { handle, x, y } of handles) {
      const distance = Math.sqrt((worldPoint.x - x) ** 2 + (worldPoint.y - y) ** 2);
      if (distance <= tolerance) {
        return handle;
      }
    }
    
    return null;
  }

  /**
   * Serialize shape data
   */
  public toData(): ShapeData {
    return {
      id: this.id,
      type: this.type,
      x: this.x,
      y: this.y,
      width: this.width,
      height: this.height,
      rotation: this.rotation,
      style: { ...this.style },
    };
  }

  /**
   * Apply style
   */
  public setStyle(style: Partial<ShapeStyle>): void {
    this.style = { ...this.style, ...style };
  }
}
