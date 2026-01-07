// @ts-ignore
import { Point, Transform, InteractionMode, ResizeHandle } from '../types.ts';
import { InfiniteCanvas } from '../InfiniteCanvas.ts';
import { ShapeManager } from '../shapes/ShapeManager.ts';
import { Shape } from '../shapes';

/**
 * InteractionManager - 交互管理器
 * 
 * 负责处理画布上的所有用户交互，包括：
 * - 模式管理：选择、平移、绘制三种模式
 * - 图形选择：点击选择图形
 * - 图形拖拽：拖动图形改变位置
 * - 图形调整：通过控制点调整图形大小
 * - 图形绘制：拖拽创建新图形
 * - 画布平移：在空白区域拖拽平移视图
 * - 光标管理：根据交互状态显示不同光标
 * 
 * 三种交互模式：
 * - select（选择）：默认模式，可以选择、拖拽、调整图形大小
 * - pan（平移）：平移画布视图
 * - draw（绘制）：绘制新图形
 */
export class InteractionManager {
  private canvas: InfiniteCanvas;          // 画布实例
  private shapeManager: ShapeManager;      // 图形管理器
  private canvasElement: HTMLCanvasElement; // Canvas DOM 元素

  private mode: InteractionMode = 'select';  // 当前交互模式
  
  // 交互状态标志
  private isDragging = false;   // 是否正在拖拽图形
  private isResizing = false;   // 是否正在调整图形大小
  private isDrawing = false;    // 是否正在绘制新图形
  private isPanning = false;    // 是否正在平移画布
  
  // 交互起始点
  private dragStartWorld: Point = { x: 0, y: 0 };   // 世界坐标中的起始点
  // @ts-ignore
  private dragStartScreen: Point = { x: 0, y: 0 };  // 屏幕坐标中的起始点
  private activeHandle: ResizeHandle | null = null; // 当前激活的控制点
  private drawingShape: Shape | null = null;        // 正在绘制的图形

  // 控制点容差（世界坐标单位）
  private handleTolerance = 10;

  // 事件回调
  private onModeChange: ((mode: InteractionMode) => void) | null = null;  // 模式切换回调
  private onInteractionStart: (() => void) | null = null;  // 交互开始回调
  private onInteractionEnd: (() => void) | null = null;    // 交互结束回调

  constructor(
    canvas: InfiniteCanvas,
    shapeManager: ShapeManager,
    canvasElement: HTMLCanvasElement
  ) {
    this.canvas = canvas;
    this.shapeManager = shapeManager;
    this.canvasElement = canvasElement;

    this.bindEvents();  // 绑定事件监听器
  }

  /**
   * 绑定所有事件监听器
   * @private
   */
  private bindEvents(): void {
    this.canvasElement.addEventListener('mousedown', this.handleMouseDown.bind(this));
    this.canvasElement.addEventListener('mousemove', this.handleMouseMove.bind(this));
    this.canvasElement.addEventListener('mouseup', this.handleMouseUp.bind(this));
    this.canvasElement.addEventListener('mouseleave', this.handleMouseUp.bind(this));

    // 键盘事件（删除键）
    window.addEventListener('keydown', this.handleKeyDown.bind(this));
  }

  /**
   * 获取鼠标位置（屏幕坐标和世界坐标）
   * @private
   * @param e - 鼠标事件
   * @returns 屏幕坐标和世界坐标
   */
  private getMousePosition(e: MouseEvent): { screen: Point; world: Point } {
    const rect = this.canvasElement.getBoundingClientRect();
    const screen = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
    const world = this.canvas.screenToWorld(screen);  // 转换为世界坐标
    return { screen, world };
  }

  /**
   * 处理鼠标按下事件
   * 根据当前模式执行不同的操作
   * @private
   */
  private handleMouseDown(e: MouseEvent): void {
    console.log("down one")
    // 仅处理左键
    if (e.button !== 0) return;

    const { screen, world } = this.getMousePosition(e);
    this.dragStartWorld = world;
    this.dragStartScreen = screen;

    // 根据缩放级别调整控制点容差
    const transform = this.canvas.getTransform();
    this.handleTolerance = 10 / transform.scale;

    // 根据当前模式处理
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

  /**
   * 处理选择模式下的鼠标按下
   * 检查是否点击了控制点、图形或空白区域
   * @private
   */
  private handleSelectMouseDown(world: Point): void {
    const selectedShape = this.shapeManager.getSelectedShape();
    
    // 检查是否点击了调整大小的控制点
    if (selectedShape) {
      const handle = selectedShape.getHandleAtPoint(world, this.handleTolerance);
      if (handle) {
        this.isResizing = true;
        this.activeHandle = handle;
        this.setCursor(handle);
        return;
      }
    }

    // 检查是否点击了图形
    const shape = this.shapeManager.getShapeAtPoint(world);
    if (shape) {
      this.shapeManager.selectShape(shape);
      this.isDragging = true;
      this.canvasElement.style.cursor = 'move';
    } else {
      // 点击空白区域 - 取消选择并启用平移
      this.shapeManager.deselectAll();
      this.isPanning = true;
    }
  }

  /**
   * 处理绘制模式下的鼠标按下
   * 开始绘制新图形
   * @private
   */
  private handleDrawMouseDown(world: Point): void {
    this.isDrawing = true;
    // 创建最小尺寸的图形，随着拖拽调整大小
    this.drawingShape = this.shapeManager.createShape(
      world.x,
      world.y,
      0,
      1,
      1
    );
  }

  /**
   * 处理鼠标移动事件
   * 根据当前状态执行拖拽、调整大小或绘制操作
   * @private
   */
  private handleMouseMove(e: MouseEvent): void {
    // @ts-ignore
    const { screen, world } = this.getMousePosition(e);
    
    if (this.isPanning) {
      // 让 InfiniteCanvas 处理平移
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
      this.updateCursor(world);  // 更新光标样式
    }
  }

  /**
   * 处理拖拽图形的移动
   * @private
   */
  private handleDragMove(world: Point): void {
    const selectedShape = this.shapeManager.getSelectedShape();
    if (!selectedShape) return;

    // 计算移动增量
    const dx = world.x - this.dragStartWorld.x;
    const dy = world.y - this.dragStartWorld.y;

    selectedShape.move(dx, dy);
    this.dragStartWorld = world;  // 更新起始点
  }

  /**
   * 处理调整图形大小的移动
   * @private
   */
  private handleResizeMove(world: Point): void {
    const selectedShape = this.shapeManager.getSelectedShape();
    if (!selectedShape || !this.activeHandle) return;

    // 计算移动增量
    const delta: Point = {
      x: world.x - this.dragStartWorld.x,
      y: world.y - this.dragStartWorld.y,
    };

    selectedShape.resizeByHandle(this.activeHandle, delta);
    this.dragStartWorld = world;  // 更新起始点
  }

  /**
   * 处理绘制图形的移动
   * 根据拖拽距离动态调整图形大小
   * @private
   */
  private handleDrawMove(world: Point): void {
    if (!this.drawingShape) return;

    // 从拖拽起始点计算尺寸
    let width = world.x - this.dragStartWorld.x;
    let height = world.y - this.dragStartWorld.y;

    // 处理负尺寸（向上/向左拖拽）
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

    // 更新图形位置和尺寸（最小 10x10）
    this.drawingShape.setPosition(x, y);
    this.drawingShape.setSize(Math.max(10, width), Math.max(10, height));
  }

  /**
   * 处理鼠标释放事件
   * 完成当前交互并重置状态
   * @private
   */
  private handleMouseUp(_e: MouseEvent): void {
    if (this.isDrawing && this.drawingShape) {
      // 如果图形太小，删除它
      if (this.drawingShape.width < 10 || this.drawingShape.height < 10) {
        this.shapeManager.removeShape(this.drawingShape.id);
      } else {
        // 选中新创建的图形
        this.shapeManager.selectShape(this.drawingShape);
        // 绘制完成后切换到选择模式
        this.setMode('select');
      }
    }

    // 重置所有交互状态
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

  /**
   * 处理键盘事件
   * 支持删除和取消选择快捷键
   * @private
   */
  private handleKeyDown(e: KeyboardEvent): void {
    // Delete/Backspace 删除选中的图形
    if (e.key === 'Delete' || e.key === 'Backspace') {
      this.shapeManager.deleteSelected();
      e.preventDefault();
    }
    
    // Escape 取消选择
    if (e.key === 'Escape') {
      this.shapeManager.deselectAll();
      this.setMode('select');
    }
  }

  /**
   * 根据鼠标位置更新光标样式
   * @private
   */
  private updateCursor(world: Point): void {
    const selectedShape = this.shapeManager.getSelectedShape();
    
    // 优先检查控制点
    if (selectedShape) {
      const handle = selectedShape.getHandleAtPoint(world, this.handleTolerance);
      if (handle) {
        this.setCursor(handle);
        return;
      }
    }

    // 检查是否在图形上
    const shape = this.shapeManager.getShapeAtPoint(world);
    if (shape) {
      this.canvasElement.style.cursor = 'move';
    } else {
      this.canvasElement.style.cursor = 'default';
    }
  }

  /**
   * 根据控制点类型设置对应的光标样式
   * @private
   */
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

  /**
   * 根据当前模式更新光标样式
   * @private
   */
  private updateCursorForMode(): void {
    switch (this.mode) {
      case 'select':
        this.canvasElement.style.cursor = 'default';
        break;
      case 'draw':
        this.canvasElement.style.cursor = 'crosshair';  // 十字光标
        break;
      case 'pan':
        this.canvasElement.style.cursor = 'grab';       // 抓手光标
        break;
    }
  }

  // 公共 API
  
  /**
   * 设置交互模式
   * @param mode - 新的交互模式
   */
  public setMode(mode: InteractionMode): void {
    this.mode = mode;
    // 更新画布平移模式
    this.canvas.setPanEnabled(mode === 'pan');
    this.updateCursorForMode();
    if (this.onModeChange) {
      this.onModeChange(mode);
    }
  }

  /**
   * 获取当前交互模式
   * @returns 当前模式
   */
  public getMode(): InteractionMode {
    return this.mode;
  }

  /**
   * 设置模式切换回调
   * @param callback - 回调函数
   */
  public setOnModeChange(callback: (mode: InteractionMode) => void): void {
    this.onModeChange = callback;
  }

  /**
   * 设置交互开始回调
   * @param callback - 回调函数
   */
  public setOnInteractionStart(callback: () => void): void {
    this.onInteractionStart = callback;
  }

  /**
   * 设置交互结束回调
   * @param callback - 回调函数
   */
  public setOnInteractionEnd(callback: () => void): void {
    this.onInteractionEnd = callback;
  }

  /**
   * 检查是否正在进行应阻止画布平移的交互
   * @returns 如果正在拖拽、调整大小或绘制，返回 true
   */
  public isInteracting(): boolean {
    return this.isDragging || this.isResizing || this.isDrawing;
  }
}
