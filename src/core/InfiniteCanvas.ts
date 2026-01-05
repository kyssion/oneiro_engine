import { Point, Transform, CanvasConfig, ViewportBounds } from './types';

/**
 * InfiniteCanvas - 无限画布核心类
 * 
 * 这是画布引擎的核心类，负责处理：
 * - 画布的缩放和平移变换
 * - 鼠标、触摸等输入事件
 * - 屏幕坐标与世界坐标的转换
 * - 画布尺寸自适应和高清屏支持
 * 
 * 主要功能：
 * - 无限缩放：支持从 1% 到 10000% 的缩放范围
 * - 平滑平移：鼠标拖动或中键平移画布
 * - 触摸支持：单指拖动、双指缩放和平移
 * - 坐标转换：屏幕坐标 ↔ 世界坐标
 */
export class InfiniteCanvas {
  // Canvas 元素和绘图上下文
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private config: CanvasConfig;  // 画布配置（缩放范围、灵敏度等）
  
  // 变换状态
  private transform: Transform = {
    scale: 1,      // 当前缩放比例
    offsetX: 0,    // X 轴偏移
    offsetY: 0,    // Y 轴偏移
  };

  // 交互状态
  private isDragging = false;        // 是否正在拖动
  private isPanEnabled = false;      // 是否启用平移模式（外部控制）
  private lastMousePos: Point = { x: 0, y: 0 };         // 上次鼠标位置（屏幕坐标）
  private currentMouseWorldPos: Point = { x: 0, y: 0 }; // 当前鼠标位置（世界坐标）

  // 回调函数
  private onTransformChange: ((transform: Transform) => void) | null = null;  // 变换改变时的回调
  private onMouseMove: ((worldPos: Point) => void) | null = null;             // 鼠标移动时的回调

  /**
   * 构造函数
   * @param canvas - HTML Canvas 元素
   * @param config - 可选的画布配置
   */
  constructor(canvas: HTMLCanvasElement, config?: Partial<CanvasConfig>) {
    this.canvas = canvas;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('Failed to get 2D context');
    }
    this.ctx = ctx;

    // 合并默认配置和用户配置
    this.config = {
      minScale: 0.01,           // 最小缩放 1%
      maxScale: 100,            // 最大缩放 10000%
      zoomSensitivity: 0.001,   // 缩放灵敏度
      ...config,
    };

    this.setupCanvas();  // 设置画布
    this.bindEvents();   // 绑定事件监听器
  }

  /**
   * 设置画布
   * 初始化画布尺寸并监听窗口大小变化
   */
  private setupCanvas(): void {
    this.resize();
    window.addEventListener('resize', () => this.resize());
  }

  /**
   * 调整画布尺寸
   * 根据容器大小和设备像素比调整画布分辨率，支持高清屏
   */
  private resize(): void {
    const container = this.canvas.parentElement;
    if (container) {
      const dpr = window.devicePixelRatio || 1;  // 设备像素比（高清屏 > 1）
      const rect = container.getBoundingClientRect();
      
      // 设置画布实际像素大小（考虑设备像素比）
      this.canvas.width = rect.width * dpr;
      this.canvas.height = rect.height * dpr;
      // 设置画布显示大小
      this.canvas.style.width = `${rect.width}px`;
      this.canvas.style.height = `${rect.height}px`;
      
      // 缩放绘图上下文以匹配设备像素比
      this.ctx.scale(dpr, dpr);
    }
    this.notifyTransformChange();
  }

  /**
   * 绑定所有输入事件监听器
   * 包括鼠标事件和触摸事件
   */
  private bindEvents(): void {
    // 鼠标滚轮事件（缩放）
    this.canvas.addEventListener('wheel', this.handleWheel.bind(this), { passive: false });
    // 鼠标按下事件
    this.canvas.addEventListener('mousedown', this.handleMouseDown.bind(this));
    // 鼠标移动事件
    this.canvas.addEventListener('mousemove', this.handleMouseMove.bind(this));
    // 鼠标释放事件
    this.canvas.addEventListener('mouseup', this.handleMouseUp.bind(this));
    // 鼠标离开画布事件
    this.canvas.addEventListener('mouseleave', this.handleMouseOut.bind(this));
    
    // 触摸事件支持
    this.canvas.addEventListener('touchstart', this.handleTouchStart.bind(this), { passive: false });
    this.canvas.addEventListener('touchmove', this.handleTouchMove.bind(this), { passive: false });
    this.canvas.addEventListener('touchend', this.handleTouchEnd.bind(this));
  }

  /**
   * 处理鼠标滚轮事件（缩放）
   * 向鼠标位置缩放，保持鼠标指向的世界坐标点不变
   */
  private handleWheel(e: WheelEvent): void {
    e.preventDefault();
    
    const rect = this.canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;  // 鼠标在画布中的 X 坐标
    const mouseY = e.clientY - rect.top;   // 鼠标在画布中的 Y 坐标

    // 计算缩放因子（使用指数函数使缩放更平滑）
    const zoomFactor = Math.exp(-e.deltaY * this.config.zoomSensitivity);
    const newScale = Math.max(
      this.config.minScale,
      Math.min(this.config.maxScale, this.transform.scale * zoomFactor)
    );

    // 计算鼠标位置对应的世界坐标（缩放前）
    const worldX = (mouseX - this.transform.offsetX) / this.transform.scale;
    const worldY = (mouseY - this.transform.offsetY) / this.transform.scale;

    // 应用新的缩放比例
    this.transform.scale = newScale;
    // 调整偏移量，使世界坐标点保持在鼠标位置
    this.transform.offsetX = mouseX - worldX * newScale;
    this.transform.offsetY = mouseY - worldY * newScale;

    this.notifyTransformChange();
  }

  /**
   * 处理鼠标按下事件
   * 仅在中键或启用平移模式时开始拖动
   */
  private handleMouseDown(e: MouseEvent): void {
    // 仅中键（button=1）或左键+平移模式时拖动
    if (e.button === 1 || (e.button === 0 && this.isPanEnabled)) {
      this.isDragging = true;
      this.lastMousePos = { x: e.clientX, y: e.clientY };
      this.canvas.style.cursor = 'grabbing';  // 改变鼠标样式 todo 这里没有生效
    }
  }

  /**
   * 处理鼠标移动事件
   * 更新鼠标世界坐标，并在拖动时平移画布
   */
  private handleMouseMove(e: MouseEvent): void {
    const rect = this.canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    // 更新当前鼠标的世界坐标
    this.currentMouseWorldPos = this.screenToWorld({ x: mouseX, y: mouseY });
    if (this.onMouseMove) {
      this.onMouseMove(this.currentMouseWorldPos);
    }

    // 如果正在拖动，平移画布
    if (this.isDragging) {
      // 都是使用相对于屏幕的数据，来确定偏移量
      const dx = e.clientX - this.lastMousePos.x;  // X 方向移动距离
      const dy = e.clientY - this.lastMousePos.y;  // Y 方向移动距离

      this.transform.offsetX += dx;
      this.transform.offsetY += dy;

      this.lastMousePos = { x: e.clientX, y: e.clientY };
      this.notifyTransformChange();
    }
  }

  /**
   * 处理鼠标释放事件
   * 停止拖动并恢复鼠标样式
   */
  private handleMouseUp(): void {
    this.isDragging = false;
    if (this.isPanEnabled) {
      this.canvas.style.cursor = 'grab';
    }
  }

  /**
   * 处理鼠标离开画布事件
   * 停止拖动并恢复鼠标样式
   */
  private handleMouseOut(): void {
    this.isDragging = false;
    if (this.isPanEnabled) {
      this.canvas.style.cursor = 'grab';
    }
  }


  // 触摸事件相关的私有变量
  private lastTouchDistance = 0;                // 上次双指距离
  private lastTouchCenter: Point = { x: 0, y: 0 };  // 上次双指中心点

  /**
   * 处理触摸开始事件
   * 单指：开始拖动
   * 双指：记录初始缩放状态
   */
  private handleTouchStart(e: TouchEvent): void {
    e.preventDefault();
    if (e.touches.length === 1) {
      // 单指触摸 - 拖动
      this.isDragging = true;
      this.lastMousePos = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    } else if (e.touches.length === 2) {
      // 双指触摸 - 记录初始状态用于缩放
      this.lastTouchDistance = this.getTouchDistance(e.touches);
      this.lastTouchCenter = this.getTouchCenter(e.touches);
    }
  }

  /**
   * 处理触摸移动事件
   * 单指：平移画布
   * 双指：缩放和平移画布
   */
  private handleTouchMove(e: TouchEvent): void {
    e.preventDefault();
    if (e.touches.length === 1 && this.isDragging) {
      // 单指拖动
      const dx = e.touches[0].clientX - this.lastMousePos.x;
      const dy = e.touches[0].clientY - this.lastMousePos.y;

      this.transform.offsetX += dx;
      this.transform.offsetY += dy;

      this.lastMousePos = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      this.notifyTransformChange();
    } else if (e.touches.length === 2) {
      // 双指缩放和平移
      const distance = this.getTouchDistance(e.touches);
      const center = this.getTouchCenter(e.touches);
      
      // 根据双指距离变化计算缩放因子
      const zoomFactor = distance / this.lastTouchDistance; // 相当于上一次扩大了多少倍
      const newScale = Math.max(
        this.config.minScale,
        Math.min(this.config.maxScale, this.transform.scale * zoomFactor)
      );

      const rect = this.canvas.getBoundingClientRect();
      const centerX = center.x - rect.left;
      const centerY = center.y - rect.top;

      // 计算双指中心点对应的世界坐标
      const worldX = (centerX - this.transform.offsetX) / this.transform.scale;
      const worldY = (centerY - this.transform.offsetY) / this.transform.scale;

      // 应用缩放
      this.transform.scale = newScale;
      this.transform.offsetX = centerX - worldX * newScale;
      this.transform.offsetY = centerY - worldY * newScale;

      // 应用平移（双指中心点移动）
      this.transform.offsetX += center.x - this.lastTouchCenter.x;
      this.transform.offsetY += center.y - this.lastTouchCenter.y;

      this.lastTouchDistance = distance;
      this.lastTouchCenter = center;
      this.notifyTransformChange();
    }
  }

  /**
   * 处理触摸结束事件
   */
  private handleTouchEnd(): void {
    this.isDragging = false;
  }

  /**
   * 计算两个触摸点之间的距离
   * @param touches - 触摸点列表
   * @returns 两点间的欧氏距离
   */
  private getTouchDistance(touches: TouchList): number {
    const dx = touches[0].clientX - touches[1].clientX;
    const dy = touches[0].clientY - touches[1].clientY;
    return Math.sqrt(dx * dx + dy * dy);
  }

  /**
   * 计算两个触摸点的中心位置
   * @param touches - 触摸点列表
   * @returns 中心点坐标
   */
  private getTouchCenter(touches: TouchList): Point {
    return {
      x: (touches[0].clientX + touches[1].clientX) / 2,
      y: (touches[0].clientY + touches[1].clientY) / 2,
    };
  }

  /**
   * 通知变换状态已改变
   * 调用注册的回调函数
   */
  private notifyTransformChange(): void {
    if (this.onTransformChange) {
      this.onTransformChange({ ...this.transform });  // 传递副本避免外部修改
    }
  }

  // ==================== 公共 API ====================

  /**
   * 屏幕坐标转世界坐标
   * 将画布上的像素坐标转换为世界坐标系中的坐标
   * @param screenPos - 屏幕坐标（相对于画布左上角的像素位置）
   * @returns 世界坐标
   */
  public screenToWorld(screenPos: Point): Point {
    return {
      x: (screenPos.x - this.transform.offsetX) / this.transform.scale,
      y: (screenPos.y - this.transform.offsetY) / this.transform.scale,
    };
  }

  /**
   * 世界坐标转屏幕坐标
   * 将世界坐标系中的坐标转换为画布上的像素坐标
   * @param worldPos - 世界坐标
   * @returns 屏幕坐标（相对于画布左上角的像素位置）
   */
  public worldToScreen(worldPos: Point): Point {
    return {
      x: worldPos.x * this.transform.scale + this.transform.offsetX,
      y: worldPos.y * this.transform.scale + this.transform.offsetY,
    };
  }

  /**
   * 获取当前变换状态
   * @returns 变换状态的副本（防止外部修改）
   */
  public getTransform(): Transform {
    return { ...this.transform };
  }

  /**
   * 获取当前视口边界
   * 计算当前可见区域在世界坐标系中的范围
   * @returns 视口边界信息
   */
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

  /**
   * 获取 Canvas 绘图上下文
   * @returns 2D 绘图上下文
   */
  public getContext(): CanvasRenderingContext2D {
    return this.ctx;
  }

  /**
   * 获取画布显示尺寸
   * @returns 画布的宽度和高度（像素）
   */
  public getCanvasSize(): { width: number; height: number } {
    const rect = this.canvas.getBoundingClientRect();
    return { width: rect.width, height: rect.height };
  }

  /**
   * 设置变换改变回调函数
   * 当画布缩放或平移时会调用此回调
   * @param callback - 回调函数，接收新的变换状态
   */
  public setOnTransformChange(callback: (transform: Transform) => void): void {
    this.onTransformChange = callback;
  }

  /**
   * 设置鼠标移动回调函数
   * 当鼠标在画布上移动时会调用此回调
   * @param callback - 回调函数，接收鼠标的世界坐标
   */
  public setOnMouseMove(callback: (worldPos: Point) => void): void {
    this.onMouseMove = callback;
  }

  /**
   * 重置视图
   * 将画布重置为 100% 缩放，并将原点放置在左上角
   */
  public resetView(): void {
    this.transform = { scale: 1, offsetX: 0, offsetY: 0 };
    // 将原点放置在左上角（留出一定边距给 UI 元素）
    this.transform.offsetX = 80;   // 左侧工具栏宽度 + 边距
    this.transform.offsetY = 50;   // 顶部边距
    this.notifyTransformChange();
  }

  /**
   * 清空画布
   * 清除画布上的所有内容
   */
  public clear(): void {
    const size = this.getCanvasSize();
    this.ctx.clearRect(0, 0, size.width, size.height);
  }

  /**
   * 设置是否启用平移模式
   * 启用后，左键点击拖动将平移画布（而不是交给上层处理）
   * @param enabled - 是否启用平移模式
   */
  public setPanEnabled(enabled: boolean): void {
    this.isPanEnabled = enabled;
    if (enabled) {
      this.canvas.style.cursor = 'grab';  // 显示抽手样式
    }
  }

  /**
   * 获取是否启用了平移模式
   * @returns 平移模式是否启用
   */
  public getPanEnabled(): boolean {
    return this.isPanEnabled;
  }
}
