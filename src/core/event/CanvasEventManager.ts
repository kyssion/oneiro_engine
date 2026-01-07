/**
 * 整个canvas所有的时间的统一控制中心。
 */
import {CoordinateSystem, GridRenderer, InfiniteCanvas, ShapeManager} from "@/core";
import {CanvasEvent} from "@/core/CanvasEvent.ts";

export class CanvasEventManager extends CanvasEvent{
    private infiniteCanvas: InfiniteCanvas; // 全局背景缩放位移类
    private coordinateSystem: CoordinateSystem; // 坐标轴
    private gridRenderer: GridRenderer; // 网格
    private shapeManager: ShapeManager;      // 图形管理器
    constructor(infiniteCanvas: InfiniteCanvas,coordinateSystem: CoordinateSystem, gridRenderer: GridRenderer, shapeManager: ShapeManager) {
        this.infiniteCanvas = infiniteCanvas;
        this.coordinateSystem = coordinateSystem;
        this.gridRenderer = gridRenderer;
        this.shapeManager = shapeManager;
    }

    // 1. 判断当前命中的是哪一个单位

    // 鼠标滚轮事件（缩放）
    public handleWheel(_e: WheelEvent): void {
        // 显示简单的遍历
    }
    // 鼠标按下事件
    public handleMouseDown(_e: MouseEvent): void {}

    // 处理鼠标移动事件
    public  handleMouseMove(_e: MouseEvent): void {}

    // 鼠标释放事件
    public  handleMouseUp(_e: MouseEvent): void {}

    // 鼠标离开画布事件
    public  handleMouseOut(_e: MouseEvent): void {}

    // 触摸事件支持
    public  handleTouchStart(_e: TouchEvent): void {}
    public  handleTouchMove(_e: TouchEvent): void {}
    public  handleTouchEnd(_e: TouchEvent): void {}
}