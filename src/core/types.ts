/**
 * Common type definitions for the canvas engine
 */

export interface Point {
  x: number;
  y: number;
}

export interface Transform {
  scale: number;
  offsetX: number;
  offsetY: number;
}

export type GridPattern = 'grid' | 'dots';

export interface GridConfig {
  pattern: GridPattern;
  baseGridSize: number;
  minGridSize: number;
  maxGridSize: number;
  gridColor: string;
  subGridColor: string;
  dotRadius: number;
}

export interface CanvasConfig {
  minScale: number;
  maxScale: number;
  zoomSensitivity: number;
}

export interface ViewportBounds {
  left: number;
  right: number;
  top: number;
  bottom: number;
  width: number;
  height: number;
}

// Shape types
export type ShapeType = 'rectangle' | 'circle' | 'triangle';

export type InteractionMode = 'select' | 'pan' | 'draw';

export interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface ShapeStyle {
  fillColor: string;
  strokeColor: string;
  strokeWidth: number;
  opacity: number;
}

export interface ShapeData {
  id: string;
  type: ShapeType;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  style: ShapeStyle;
}

export type ResizeHandle = 
  | 'top-left' 
  | 'top-center' 
  | 'top-right' 
  | 'middle-left' 
  | 'middle-right' 
  | 'bottom-left' 
  | 'bottom-center' 
  | 'bottom-right';

export interface HandleInfo {
  handle: ResizeHandle;
  x: number;
  y: number;
}
