import { Point, Transform, ShapeType, ShapeStyle } from '../types.ts';
import { Shape, Rectangle, Circle, Triangle } from './index.ts';

/**
 * ShapeManager - 图形管理器
 * 
 * 负责管理画布上的所有图形，包括：
 * - 图形的创建和删除
 * - 图形的选择和取消选择
 * - 图形的渲染顺序管理（Z-order）
 * - 图形样式的管理
 * - 选择状态的事件通知
 * - 将恐图形的状态和相关的效果
 * 主要功能：
 * - 支持创建矩形、圆形、三角形
 * - 支持点击选择图形
 * - 支持图形的前置/后置排序
 * - 支持图形样式的统一管理
 */
export class ShapeManager {
  private shapes: Shape[] = [];                // 所有图形列表
  private selectedShape: Shape | null = null;  // 当前选中的图形
  
  // 当前绘制状态
  private currentShapeType: ShapeType = 'rectangle';  // 当前图形类型
  private currentStyle: ShapeStyle = {                // 当前图形样式
    fillColor: '#4a90d9',      // 默认填充色（蓝色）
    strokeColor: '#2a6bb8',    // 默认描边色（深蓝）
    strokeWidth: 2,            // 默认描边宽度
    opacity: 1,                // 默认不透明度
  };

  // 事件回调
  private onSelectionChange: ((shape: Shape | null) => void) | null = null;  // 选择变化回调

  constructor() {}

  /**
   * 创建指定类型的图形
   * 根据当前图形类型创建对应的图形实例
   *
   * @param x - X 坐标（世界坐标）
   * @param y - Y 坐标（世界坐标）
   * @param z - Z 层级
   * @param width - 宽度
   * @param height - 高度
   * @returns 创建的图形实例
   */
  public createShape(x: number, y: number,z: number, width: number, height: number): Shape {
    let shape: Shape;

    // 根据当前图形类型创建对应的图形
    switch (this.currentShapeType) {
      case 'rectangle':
        shape = new Rectangle(x, y, z, width, height, { ...this.currentStyle });
        break;
      case 'circle':
        shape = new Circle(x, y, z, width, height, { ...this.currentStyle });
        break;
      case 'triangle':
        shape = new Triangle(x, y, z, width, height, { ...this.currentStyle });
        break;
      default:
        shape = new Rectangle(x, y, z, width, height, { ...this.currentStyle });
    }

    this.shapes.push(shape);  // 添加到图形列表
    return shape;
  }

  /**
   * 添加已存在的图形
   * @param shape - 要添加的图形实例
   */
  public addShape(shape: Shape): void {
    this.shapes.push(shape);
  }

  /**
   * 删除指定图形
   * 如果删除的是选中图形，会自动取消选择
   * 
   * @param shapeId - 图形 ID
   */
  public removeShape(shapeId: string): void {
    const index = this.shapes.findIndex(s => s.id === shapeId);
    if (index !== -1) {
      // 如果删除的是选中图形，先取消选择
      if (this.selectedShape?.id === shapeId) {
        this.deselectAll();
      }
      this.shapes.splice(index, 1);
    }
  }

  /**
   * 获取指定位置的图形
   * 从上到下搜索（后添加的图形在上层）
   * 
   * @param worldPoint - 世界坐标中的点
   * @returns 点击到的图形，如果没有则返回 null
   */
  public getShapeAtPoint(worldPoint: Point): Shape | null {
    // 从后向前搜索（后添加的在上层）
    for (let i = this.shapes.length - 1; i >= 0; i--) {
      if (this.shapes[i].containsPoint(worldPoint)) {
        return this.shapes[i];
      }
    }
    return null;
  }

  /**
   * 选中指定图形
   * 会先取消所有图形的选中状态
   * 
   * @param shape - 要选中的图形
   */
  public selectShape(shape: Shape): void {
    this.deselectAll();
    shape.isSelected = true;
    this.selectedShape = shape;
    this.notifySelectionChange();  // 通知选择变化
  }

  /**
   * 通过 ID 选中图形
   * @param shapeId - 图形 ID
   */
  public selectShapeById(shapeId: string): void {
    const shape = this.shapes.find(s => s.id === shapeId);
    if (shape) {
      this.selectShape(shape);
    }
  }

  /**
   * 取消所有图形的选中状态
   */
  public deselectAll(): void {
    this.shapes.forEach(s => s.isSelected = false);
    this.selectedShape = null;
    this.notifySelectionChange();
  }

  /**
   * 获取当前选中的图形
   * @returns 选中的图形，如果没有则返回 null
   */
  public getSelectedShape(): Shape | null {
    return this.selectedShape;
  }

  /**
   * 尝试在指定位置选中图形
   * 如果点击到图形则选中，否则取消所有选择
   * 
   * @param worldPoint - 世界坐标中的点
   * @returns 选中的图形，如果没有则返回 null
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
   * 渲染所有图形
   * 按添加顺序渲染（先添加的在底层）
   * 
   * @param ctx - 绘图上下文
   * @param transform - 画布变换状态
   */
  public render(ctx: CanvasRenderingContext2D, transform: Transform): void {
    // 按顺序渲染图形（先添加的在底层）
    this.shapes.forEach(shape => {
      shape.render(ctx, transform);
    });
  }

  /**
   * 获取所有图形
   * @returns 图形数组的副本
   */
  public getShapes(): Shape[] {
    return [...this.shapes];
  }

  /**
   * 设置当前图形类型
   * 新创建的图形将使用此类型
   * 
   * @param type - 图形类型
   */
  public setShapeType(type: ShapeType): void {
    this.currentShapeType = type;
  }

  /**
   * 获取当前图形类型
   * @returns 当前图形类型
   */
  public getShapeType(): ShapeType {
    return this.currentShapeType;
  }

  /**
   * 设置当前样式
   * 新创建的图形将使用此样式
   * 
   * @param style - 样式配置（部分或全部）
   */
  public setStyle(style: Partial<ShapeStyle>): void {
    this.currentStyle = { ...this.currentStyle, ...style };
  }

  /**
   * 获取当前样式
   * @returns 当前样式的副本
   */
  public getStyle(): ShapeStyle {
    return { ...this.currentStyle };
  }

  /**
   * 将样式应用到选中的图形
   * 同时会更新当前样式，影响后续创建的图形
   * 
   * @param style - 要应用的样式
   */
  public applyStyleToSelected(style: Partial<ShapeStyle>): void {
    if (this.selectedShape) {
      this.selectedShape.setStyle(style);
    }
    // 同时更新当前样式，用于后续创建的图形
    this.setStyle(style);
  }

  /**
   * 设置选择变化回调函数
   * 当图形选择状态改变时会调用此回调
   * 
   * @param callback - 回调函数
   */
  public setOnSelectionChange(callback: (shape: Shape | null) => void): void {
    this.onSelectionChange = callback;
  }

  /**
   * 通知选择状态已改变
   * @private
   */
  private notifySelectionChange(): void {
    if (this.onSelectionChange) {
      this.onSelectionChange(this.selectedShape);
    }
  }

  /**
   * 将选中的图形移到最前
   * 修改 Z-order，使图形显示在最上层
   */
  public bringToFront(): void {
    if (!this.selectedShape) return;
    const index = this.shapes.indexOf(this.selectedShape);
    if (index !== -1 && index !== this.shapes.length - 1) {
      this.shapes.splice(index, 1);           // 从原位置移除
      this.shapes.push(this.selectedShape);   // 添加到末尾（最上层）
    }
  }

  /**
   * 将选中的图形移到最后
   * 修改 Z-order，使图形显示在最底层
   */
  public sendToBack(): void {
    if (!this.selectedShape) return;
    const index = this.shapes.indexOf(this.selectedShape);
    if (index !== -1 && index !== 0) {
      this.shapes.splice(index, 1);            // 从原位置移除
      this.shapes.unshift(this.selectedShape); // 添加到开头（最底层）
    }
  }

  /**
   * 删除选中的图形
   */
  public deleteSelected(): void {
    if (this.selectedShape) {
      this.removeShape(this.selectedShape.id);
    }
  }

  /**
   * 清空所有图形
   */
  public clear(): void {
    this.shapes = [];
    this.selectedShape = null;
    this.notifySelectionChange();
  }
}
