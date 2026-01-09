/**
 * 导入核心模块
 */
import {
    InfiniteCanvas,       // 无限画布核心类
    GridRenderer,         // 网格渲染器
    CoordinateSystem,     // 坐标系渲染器
    ShapeManager,         // 图形管理器
    InteractionManager,   // 交互管理器
    GridPattern,          // 网格模式类型
    ShapeType,            // 图形类型
    InteractionMode,      // 交互模式类型
    CoordinateAxisMode    // 坐标轴显示模式类型
} from '.';

/**
 * 导入工具函数
 */
import {
    getContrastingGridColors,
    getContrastingAxisColors,
    getFixedAxisBackgroundColor
} from '@/utils';

/**
 * App - 应用程序主类
 *
 * 负责统筹所有画布组件和 UI 交互。
 * 这是应用程序的入口点，负责：
 * - 初始化所有核心组件（画布、网格、坐标系、图形等）
 * - 绑定 UI 事件监听器
 * - 处理用户交互（工具切换、颜色选择、快捷键等）
 * - 管理渲染循环
 */
export class App {
    // 核心组件
    private canvas: InfiniteCanvas;           // 无限画布实例
    private gridRenderer: GridRenderer;       // 网格渲染器实例
    private coordinateSystem: CoordinateSystem;  // 坐标系实例
    private shapeManager: ShapeManager;       // 图形管理器实例
    private interactionManager: InteractionManager;  // 交互管理器实例
    private animationFrameId: number | null = null;  // 动画帧 ID（用于取消动画）
    private canvasElement: HTMLCanvasElement;  // Canvas DOM 元素

    // UI 元素（视图控制）
    private patternSelect!: HTMLSelectElement;   // 网格模式选择器
    private axisModeSelect!: HTMLSelectElement;  // 坐标轴模式选择器
    private zoomDisplay!: HTMLSpanElement;       // 缩放级别显示
    private coordDisplay!: HTMLSpanElement;      // 坐标显示
    // private modeDisplay!: HTMLSpanElement;       // 模式显示
    private resetBtn!: HTMLButtonElement;        // 重置视图按钮
    private deleteBtn!: HTMLButtonElement;       // 删除图形按钮

    // 工具按钮
    private toolSelectBtn!: HTMLButtonElement;   // 选择工具按钮
    private toolPanBtn!: HTMLButtonElement;      // 平移工具按钮
    private shapeRectBtn!: HTMLButtonElement;    // 矩形工具按钮
    private shapeCircleBtn!: HTMLButtonElement;  // 圆形工具按钮
    private shapeTriangleBtn!: HTMLButtonElement;  // 三角形工具按钮

    // 颜色选择器
    private fillColorInput!: HTMLInputElement;    // 填充颜色选择器
    private strokeColorInput!: HTMLInputElement;  // 描边颜色选择器
    private fillColorLabel!: HTMLSpanElement;     // 填充颜色标签
    private strokeColorLabel!: HTMLSpanElement;   // 描边颜色标签

    // 背景颜色
    private bgColorInput!: HTMLInputElement;      // 背景颜色选择器
    private bgColorLabel!: HTMLSpanElement;       // 背景颜色标签
    private backgroundColor = '#ffffff';         // 当前背景颜色（默认白色）

    /**
     * 构造函数
     * 初始化所有组件并启动应用
     */
    constructor() {
        // 获取 Canvas 元素
        this.canvasElement = document.getElementById('main-canvas') as HTMLCanvasElement;
        if (!this.canvasElement) {
            throw new Error('Canvas element not found');
        }

        // 初始化所有核心组件
        this.canvas = new InfiniteCanvas(this.canvasElement);
        this.gridRenderer = new GridRenderer();
        this.coordinateSystem = new CoordinateSystem(this.gridRenderer);

        this.shapeManager = new ShapeManager();
        this.interactionManager = new InteractionManager(
            this.canvas,
            this.shapeManager,
            this.canvasElement
        );

        this.getUIElements();      // 获取 UI 元素引用
        this.setupEventListeners();  // 设置事件监听器
        this.canvas.resetView();     // 重置视图到初始状态
        this.startRenderLoop();      // 启动渲染循环
    }

    /**
     * 获取所有 UI 元素的引用
     * 将 DOM 元素存储为类属性以便后续使用
     */
    private getUIElements(): void {
        // 视图控制
        this.patternSelect = document.getElementById('pattern-select') as HTMLSelectElement;
        this.axisModeSelect = document.getElementById('axis-mode-select') as HTMLSelectElement;
        this.zoomDisplay = document.getElementById('zoom-display') as HTMLSpanElement;
        this.coordDisplay = document.getElementById('coord-display') as HTMLSpanElement;
        // this.modeDisplay = document.getElementById('mode-display') as HTMLSpanElement;
        this.resetBtn = document.getElementById('reset-btn') as HTMLButtonElement;
        this.deleteBtn = document.getElementById('delete-btn') as HTMLButtonElement;

        // 工具按钮
        this.toolSelectBtn = document.getElementById('tool-select') as HTMLButtonElement;
        this.toolPanBtn = document.getElementById('tool-pan') as HTMLButtonElement;
        this.shapeRectBtn = document.getElementById('shape-rect') as HTMLButtonElement;
        this.shapeCircleBtn = document.getElementById('shape-circle') as HTMLButtonElement;
        this.shapeTriangleBtn = document.getElementById('shape-triangle') as HTMLButtonElement;

        // 颜色选择器
        this.fillColorInput = document.getElementById('fill-color') as HTMLInputElement;
        this.strokeColorInput = document.getElementById('stroke-color') as HTMLInputElement;
        this.fillColorLabel = document.getElementById('fill-color-label') as HTMLSpanElement;
        this.strokeColorLabel = document.getElementById('stroke-color-label') as HTMLSpanElement;

        // 背景颜色
        this.bgColorInput = document.getElementById('bg-color') as HTMLInputElement;
        this.bgColorLabel = document.getElementById('bg-color-label') as HTMLSpanElement;
    }

    /**
     * 设置所有事件监听器
     * 包括 UI 控件、工具按钮、颜色选择器、快捷键等
     */
    private setupEventListeners(): void {
        // 网格模式选择
        this.patternSelect.addEventListener('change', (e) => {
            const pattern = (e.target as HTMLSelectElement).value as GridPattern;
            this.gridRenderer.setPattern(pattern);
        });

        // 坐标轴显示模式选择
        this.axisModeSelect.addEventListener('change', (e) => {
            const mode = (e.target as HTMLSelectElement).value as CoordinateAxisMode;
            this.coordinateSystem.setDisplayMode(mode);
        });

        // 重置视图按钮
        this.resetBtn.addEventListener('click', () => {
            this.canvas.resetView();
        });

        // 删除选中图形按钮
        this.deleteBtn.addEventListener('click', () => {
            this.shapeManager.deleteSelected();
        });

        // 工具按钮 - 选择模式
        this.toolSelectBtn.addEventListener('click', () => {
            this.setMode('select');
        });

        // 工具按钮 - 平移模式
        this.toolPanBtn.addEventListener('click', () => {
            this.setMode('translation');
        });

        // 图形按钮 - 矩形
        this.shapeRectBtn.addEventListener('click', () => {
            this.setDrawMode('rectangle');
        });

        // 图形按钮 - 圆形
        this.shapeCircleBtn.addEventListener('click', () => {
            this.setDrawMode('circle');
        });

        // 图形按钮 - 三角形
        this.shapeTriangleBtn.addEventListener('click', () => {
            this.setDrawMode('triangle');
        });

        // 填充颜色选择器
        this.fillColorInput.addEventListener('input', (e) => {
            const color = (e.target as HTMLInputElement).value;
            this.fillColorLabel.textContent = color;
            this.shapeManager.applyStyleToSelected({ fillColor: color });
        });

        // 描边颜色选择器
        this.strokeColorInput.addEventListener('input', (e) => {
            const color = (e.target as HTMLInputElement).value;
            this.strokeColorLabel.textContent = color;
            this.shapeManager.applyStyleToSelected({ strokeColor: color });
        });

        // 背景颜色选择器
        this.bgColorInput.addEventListener('input', (e) => {
            const color = (e.target as HTMLInputElement).value;
            this.setBackgroundColor(color);
        });

        // 画布变换监听器（更新缩放显示）
        this.canvas.setOnTransformChange((transform) => {
            const zoomPercent = (transform.scale * 100).toFixed(0);
            this.zoomDisplay.textContent = `${zoomPercent}%`;
        });

        // 鼠标移动监听器（更新坐标显示）
        this.canvas.setOnMouseMove((worldPos) => {
            const x = worldPos.x.toFixed(1);
            const y = (-worldPos.y).toFixed(1);  // Y 轴反转显示
            this.coordDisplay.textContent = `X: ${x}, Y: ${y}`;
        });

        // 交互模式变化监听器
        this.interactionManager.setOnModeChange((mode) => {
            this.updateModeUI(mode);
        });

        // 图形选中变化监听器
        this.shapeManager.setOnSelectionChange((shape) => {
            if (shape) {
                // 更新颜色选择器以匹配选中图形的颜色
                this.fillColorInput.value = shape.style.fillColor;
                this.strokeColorInput.value = shape.style.strokeColor;
                this.fillColorLabel.textContent = shape.style.fillColor;
                this.strokeColorLabel.textContent = shape.style.strokeColor;
            }
        });

        // 键盘快捷键
        window.addEventListener('keydown', (e) => {
            // 在输入框中输入时不处理快捷键
            if (e.target instanceof HTMLInputElement || e.target instanceof HTMLSelectElement) {
                return;
            }

            switch (e.key.toLowerCase()) {
                case 'v':  // V - 选择模式
                    this.setMode('select');
                    break;
                case 'h':  // H - 平移模式（Hand tool）
                    this.setMode('translation');
                    break;
                case 'r':  // R - 矩形
                    this.setDrawMode('rectangle');
                    break;
                case 'c':  // C - 圆形
                    this.setDrawMode('circle');
                    break;
                case 't':  // T - 三角形
                    this.setDrawMode('triangle');
                    break;
            }
        });

        // 设置可拖拽面板
        this.setupDraggablePanels();
    }

    /**
     * 设置可拖拽面板
     * 为工具栏和控制面板添加拖拽功能
     */
    private setupDraggablePanels(): void {
        const dragHandles = document.querySelectorAll('.panel-drag-handle');

        dragHandles.forEach(handle => {
            const targetId = (handle as HTMLElement).dataset.target;
            if (!targetId) return;

            const panel = document.getElementById(targetId);
            if (!panel) return;

            let isDragging = false;
            let startX = 0;
            let startY = 0;
            let initialLeft = 0;
            let initialTop = 0;

            // 鼠标按下 - 开始拖拽
            handle.addEventListener('mousedown', (e: Event) => {
                const mouseEvent = e as MouseEvent;
                isDragging = true;
                startX = mouseEvent.clientX;
                startY = mouseEvent.clientY;

                // 获取当前面板位置
                const rect = panel.getBoundingClientRect();
                initialLeft = rect.left;
                initialTop = rect.top;

                // 切换到绝对定位（如果之前用的是 right）
                panel.style.left = `${initialLeft}px`;
                panel.style.top = `${initialTop}px`;
                panel.style.right = 'auto';

                panel.classList.add('dragging');
                mouseEvent.preventDefault();
            });

            // 鼠标移动 - 拖拽中
            document.addEventListener('mousemove', (e: MouseEvent) => {
                if (!isDragging) return;

                const dx = e.clientX - startX;
                const dy = e.clientY - startY;

                // 计算新位置
                let newLeft = initialLeft + dx;
                let newTop = initialTop + dy;

                // 限制在窗口范围内
                const panelRect = panel.getBoundingClientRect();
                const maxLeft = window.innerWidth - panelRect.width;
                const maxTop = window.innerHeight - panelRect.height;

                newLeft = Math.max(0, Math.min(newLeft, maxLeft));
                newTop = Math.max(0, Math.min(newTop, maxTop));

                panel.style.left = `${newLeft}px`;
                panel.style.top = `${newTop}px`;
            });

            // 鼠标释放 - 停止拖拽
            document.addEventListener('mouseup', () => {
                if (isDragging) {
                    isDragging = false;
                    panel.classList.remove('dragging');
                }
            });
        });
    }

    /**
     * 设置交互模式
     * @param mode - 交互模式（select/pan/draw）
     */
    private setMode(mode: InteractionMode): void {
        this.interactionManager.setMode(mode);
        this.updateModeUI(mode);
    }

    /**
     * 设置绘制模式并指定图形类型
     * @param shapeType - 图形类型（rectangle/circle/triangle）
     */
    private setDrawMode(shapeType: ShapeType): void {
        this.shapeManager.setShapeType(shapeType);
        this.interactionManager.setMode('draw');
        this.updateModeUI('draw', shapeType);
    }

    /**
     * 更新 UI 以反映当前模式
     * 高亮活动工具按钮并更新模式显示
     *
     * @param mode - 当前交互模式
     * @param shapeType - 可选的图形类型（仅在 draw 模式下）
     */
    private updateModeUI(mode: InteractionMode, shapeType?: ShapeType): void {
        // 清除所有按钮的高亮状态
        this.toolSelectBtn.classList.remove('active');
        this.toolPanBtn.classList.remove('active');
        this.shapeRectBtn.classList.remove('active');
        this.shapeCircleBtn.classList.remove('active');
        this.shapeTriangleBtn.classList.remove('active');

        // 根据模式设置对应按钮为活动状态
        switch (mode) {
            case 'select':
                this.toolSelectBtn.classList.add('active');
                // this.modeDisplay.textContent = 'Select Mode';
                break;
            case 'translation':
                this.toolPanBtn.classList.add('active');
                // this.modeDisplay.textContent = 'Pan Mode';
                break;
            case 'draw':
                const type = shapeType || this.shapeManager.getShapeType();
                switch (type) {
                    case 'rectangle':
                        this.shapeRectBtn.classList.add('active');
                        // this.modeDisplay.textContent = 'Draw Rectangle';
                        break;
                    case 'circle':
                        this.shapeCircleBtn.classList.add('active');
                        // this.modeDisplay.textContent = 'Draw Circle';
                        break;
                    case 'triangle':
                        this.shapeTriangleBtn.classList.add('active');
                        // this.modeDisplay.textContent = 'Draw Triangle';
                        break;
                }
                break;
        }
    }

    /**
     * 设置背景颜色并自动调整网格和坐标轴颜色以保持对比度
     * 确保网格和坐标系在任何背景下都清晰可见
     *
     * @param color - 背景颜色（CSS 颜色值）
     */
    private setBackgroundColor(color: string): void {
        this.backgroundColor = color;
        this.bgColorLabel.textContent = color;
        this.bgColorInput.value = color;

        // 根据背景色计算对比度适合的网格颜色
        const gridColors = getContrastingGridColors(color);
        this.gridRenderer.setColors(gridColors.gridColor, gridColors.subGridColor);

        // 根据背景色计算对比度适合的坐标轴颜色
        const axisColors = getContrastingAxisColors(color);
        this.coordinateSystem.setColors(
            axisColors.axisColor,
            axisColors.tickColor,
            axisColors.labelColor
        );

        // 设置固定模式坐标轴的背景颜色
        const fixedBgColor = getFixedAxisBackgroundColor(color);
        this.coordinateSystem.setFixedModeBackgroundColor(fixedBgColor);
    }

    /**
     * 渲染主循环
     * 每帧清空画布并按顺序渲染所有层
     */
    private render(): void {
        const ctx = this.canvas.getContext();
        const transform = this.canvas.getTransform();
        const bounds = this.canvas.getViewportBounds();
        const size = this.canvas.getCanvasSize();
        // 清空并填充背景色
        this.canvas.clear();
        ctx.fillStyle = this.backgroundColor;
        ctx.fillRect(0, 0, size.width, size.height);

        // 渲染网格（始终在最底层）
        this.gridRenderer.render(ctx, transform, bounds, size);

        // 根据坐标轴显示模式决定渲染顺序
        const axisMode = this.coordinateSystem.getDisplayMode();

        if (axisMode === 'fixed') {
            // 固定模式：先渲染图形，再渲染坐标轴（坐标轴在上层遮盖图形）
            this.shapeManager.render(ctx, transform);
            this.coordinateSystem.render(ctx, transform, bounds, size);
        } else {
            // 原点模式/隐藏模式：先渲染坐标轴，再渲染图形（图形在上层）
            this.coordinateSystem.render(ctx, transform, bounds, size);
            this.shapeManager.render(ctx, transform);
        }
    }

    /**
     * 启动渲染循环
     * 使用 requestAnimationFrame 实现平滑动画
     */
    private startRenderLoop(): void {
        const loop = () => {
            this.render();
            this.animationFrameId = requestAnimationFrame(loop);
        };
        loop();
    }

    /**
     * 销毁应用
     * 停止渲染循环并清理资源
     */
    public destroy(): void {
        if (this.animationFrameId !== null) {
            cancelAnimationFrame(this.animationFrameId);
        }
    }
}
