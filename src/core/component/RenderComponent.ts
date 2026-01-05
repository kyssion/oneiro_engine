/**
 * canvas 整个画板绘制层的通用工具。
 */
import {Transform, ViewportBounds} from "@/core/types.ts";

export abstract class RenderComponent {
     public abstract render(ctx: CanvasRenderingContext2D, transform: Transform, bounds: ViewportBounds, canvasSize: { width: number; height: number }): void;
}