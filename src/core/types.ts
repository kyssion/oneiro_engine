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
