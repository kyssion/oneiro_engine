import { Point, Transform, BoundingBox, ShapeStyle, ShapeType, ShapeData, ResizeHandle, HandleInfo } from '@/core';

/**
 * 生成图形的唯一 ID
 * 使用时间戳 + 随机字符串确保唯一性
 * @returns 唯一的图形 ID
 */
export function generateId(): string {
  return `shape_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Shape - 图形基类（抽象类）
 * 
 * 所有图形（矩形、圆形、三角形等）的基础类。
 * 提供通用的属性和方法，子类实现具体的渲染和点击检测逻辑。
 * 
 * 主要功能：
 * - 位置和尺寸管理：移动、调整大小
 * - 样式管理：颜色、描边、透明度
 * - 选中状态：显示边界框和调整控制点
 * - 调整控制点：8 个控制点支持图形拉伸
 */
export abstract class Shape {
  public id: string;            // 唯一标识符
  public type: ShapeType;       // 图形类型
  
  // 位置和尺寸（世界坐标）
  public x: number;             // 左上角 X 坐标
  public y: number;             // 左上角 Y 坐标
  public width: number;         // 宽度
  public height: number;        // 高度
  public rotation: number = 0;  // 旋转角度（弧度，暂未实现）
  
  // 样式
  public style: ShapeStyle;     // 颜色、描边、透明度等
  
  // 选中状态
  public isSelected: boolean = false;  // 是否被选中

  /**
   * 构造函数
   * @param type - 图形类型
   * @param x - X 坐标
   * @param y - Y 坐标
   * @param width - 宽度
   * @param height - 高度
   * @param style - 可选的样式配置
   */
  constructor(type: ShapeType, x: number, y: number, width: number, height: number, style?: Partial<ShapeStyle>) {
    this.id = generateId();
    this.type = type;
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.style = {
      fillColor: '#4a90d9',       // 默认填充颜色（蓝色）
      strokeColor: '#2a6bb8',     // 默认描边颜色（深蓝）
      strokeWidth: 2,             // 默认描边宽度
      opacity: 1,                 // 默认不透明度
      ...style,                   // 合并用户自定义样式
    };
  }

  /**
   * 获取边界框（世界坐标）
   * @returns 矩形边界框
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
   * 检查点是否在图形内（抽象方法）
   * 子类必须实现具体的点击检测逻辑
   * @param point - 点的世界坐标
   * @returns 点是否在图形内
   */
  public abstract containsPoint(point: Point): boolean;

  /**
   * 渲染图形（抽象方法）
   * 子类必须实现具体的渲染逻辑
   * @param ctx - 绘图上下文
   * @param transform - 画布变换状态
   */
  public abstract render(ctx: CanvasRenderingContext2D, transform: Transform): void;

  /**
   * 移动图形
   * @param dx - X 方向移动距离
   * @param dy - Y 方向移动距离
   */
  public move(dx: number, dy: number): void {
    this.x += dx;
    this.y += dy;
  }

  /**
   * 设置图形位置
   * @param x - 新的 X 坐标
   * @param y - 新的 Y 坐标
   */
  public setPosition(x: number, y: number): void {
    this.x = x;
    this.y = y;
  }

  /**
   * 设置图形尺寸
   * 自动限制最小尺寸为 10x10
   * @param width - 新的宽度
   * @param height - 新的高度
   */
  public setSize(width: number, height: number): void {
    this.width = Math.max(10, width);   // 最小宽度 10
    this.height = Math.max(10, height); // 最小高度 10
  }

  /**
   * 获取调整控制点位置（世界坐标）
   * 返回 8 个控制点：4 个角 + 4 个边中点
   * @returns 控制点信息数组
   */
  public getHandles(): HandleInfo[] {
    const { x, y, width, height } = this;
    const handles: HandleInfo[] = [
      { handle: 'top-left', x: x, y: y },                       // 左上角
      { handle: 'top-center', x: x + width / 2, y: y },         // 上边中点
      { handle: 'top-right', x: x + width, y: y },              // 右上角
      { handle: 'middle-left', x: x, y: y + height / 2 },       // 左边中点
      { handle: 'middle-right', x: x + width, y: y + height / 2 }, // 右边中点
      { handle: 'bottom-left', x: x, y: y + height },           // 左下角
      { handle: 'bottom-center', x: x + width / 2, y: y + height }, // 下边中点
      { handle: 'bottom-right', x: x + width, y: y + height },  // 右下角
    ];
    return handles;
  }

  /**
   * 根据控制点调整图形大小
   * 根据拖动的控制点类型，相应地调整图形的位置和尺寸
   * 
   * @param handle - 被拖动的控制点类型
   * @param worldDelta - 世界坐标中的移动增量
   */
  public resizeByHandle(handle: ResizeHandle, worldDelta: Point): void {
    switch (handle) {
      case 'top-left':       // 左上角：同时改变位置和尺寸
        this.x += worldDelta.x;
        this.y += worldDelta.y;
        this.width -= worldDelta.x;
        this.height -= worldDelta.y;
        break;
      case 'top-center':     // 上边中点：仅改变高度和Y位置
        this.y += worldDelta.y;
        this.height -= worldDelta.y;
        break;
      case 'top-right':      // 右上角
        this.y += worldDelta.y;
        this.width += worldDelta.x;
        this.height -= worldDelta.y;
        break;
      case 'middle-left':    // 左边中点：仅改变宽度和X位置
        this.x += worldDelta.x;
        this.width -= worldDelta.x;
        break;
      case 'middle-right':   // 右边中点：仅改变宽度
        this.width += worldDelta.x;
        break;
      case 'bottom-left':    // 左下角
        this.x += worldDelta.x;
        this.width -= worldDelta.x;
        this.height += worldDelta.y;
        break;
      case 'bottom-center':  // 下边中点：仅改变高度
        this.height += worldDelta.y;
        break;
      case 'bottom-right':   // 右下角：仅改变尺寸
        this.width += worldDelta.x;
        this.height += worldDelta.y;
        break;
    }
    
    // 确保最小尺寸（10x10）
    if (this.width < 10) {
      if (handle.includes('left')) this.x -= (10 - this.width);  // 左侧控制点需要调整位置
      this.width = 10;
    }
    if (this.height < 10) {
      if (handle.includes('top')) this.y -= (10 - this.height);  // 顶部控制点需要调整位置
      this.height = 10;
    }
  }

  /**
   * 渲染选中时的控制点和边界框
   * 仅当图形被选中时显示
   * 
   * @param ctx - 绘图上下文
   * @param transform - 画布变换状态
   */
  public renderHandles(ctx: CanvasRenderingContext2D, transform: Transform): void {
    if (!this.isSelected) return;  // 未选中时不渲染

    const handleSize = 8;  // 控制点大小（像素）
    const handles = this.getHandles();

    // 绘制控制点（白色填充，蓝色边框）
    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = '#4a90d9';
    ctx.lineWidth = 2;

    handles.forEach(({ x, y }) => {
      // 转换为屏幕坐标
      const screenX = x * transform.scale + transform.offsetX;
      const screenY = y * transform.scale + transform.offsetY;
      
      ctx.beginPath();
      ctx.rect(screenX - handleSize / 2, screenY - handleSize / 2, handleSize, handleSize);
      ctx.fill();
      ctx.stroke();
    });

    // 绘制边界框（虚线矩形）
    const bbox = this.getBoundingBox();
    const screenX = bbox.x * transform.scale + transform.offsetX;
    const screenY = bbox.y * transform.scale + transform.offsetY;
    const screenWidth = bbox.width * transform.scale;
    const screenHeight = bbox.height * transform.scale;

    ctx.strokeStyle = '#4a90d9';
    ctx.lineWidth = 1;
    ctx.setLineDash([5, 5]);  // 设置虚线样式
    ctx.strokeRect(screenX, screenY, screenWidth, screenHeight);
    ctx.setLineDash([]);      // 恢复实线
  }

  /**
   * 检查点是否在某个控制点上
   * 用于判断用户是否点击了控制点以进行缩放操作
   * 
   * @param worldPoint - 世界坐标中的点
   * @param tolerance - 容差范围（世界坐标单位）
   * @returns 点击的控制点类型，如果未点击任何控制点则返回 null
   */
  public getHandleAtPoint(worldPoint: Point, tolerance: number): ResizeHandle | null {
    const handles = this.getHandles();
    
    // 遍历所有控制点，检查距离
    for (const { handle, x, y } of handles) {
      const distance = Math.sqrt((worldPoint.x - x) ** 2 + (worldPoint.y - y) ** 2);
      if (distance <= tolerance) {
        return handle;
      }
    }
    
    return null;  // 未点击任何控制点
  }

  /**
   * 序列化图形数据
   * 将图形转换为普通对象，用于保存或传输
   * 
   * @returns 图形数据对象
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
      style: { ...this.style },  // 复制样式对象
    };
  }

  /**
   * 应用样式到图形
   * 支持部分样式更新
   * 
   * @param style - 要应用的样式（部分或全部）
   */
  public setStyle(style: Partial<ShapeStyle>): void {
    this.style = { ...this.style, ...style };  // 合并样式
  }
}
