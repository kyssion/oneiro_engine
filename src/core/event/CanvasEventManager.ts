/**
 *
 */
import {CoordinateSystem, GridRenderer, InfiniteCanvas, ShapeManager} from "@/core";

export class CanvasEventManager {
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

    private handleWheel(e: WheelEvent): void {

    }
}