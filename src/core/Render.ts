/**
 * canvas 整个画板绘制层的通用工具。
 */
import {Transform, ViewportBounds} from "@/core/types.ts";
import {CanvasEvent} from "@/core/CanvasEvent.ts";

export abstract class Render extends CanvasEvent{
     public abstract render(ctx: CanvasRenderingContext2D, transform: Transform, bounds: ViewportBounds, canvasSize: { width: number; height: number }): void;
}