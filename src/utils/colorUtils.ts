/**
 * 颜色工具函数
 * 
 * 为画布引擎提供颜色处理、对比度计算和自适应主题功能
 */

/**
 * 将十六进制颜色字符串解析为 RGB 值
 * @param hex - 十六进制颜色字符串 (例如: '#ffffff' 或 'ff00aa')
 * @returns RGB 对象 {r, g, b} 或 null（如果格式无效）
 */
export function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),  // 红色通道 (0-255)
        g: parseInt(result[2], 16),  // 绿色通道 (0-255)
        b: parseInt(result[3], 16),  // 蓝色通道 (0-255)
      }
    : null;
}

/**
 * 将 RGB 值转换为十六进制颜色字符串
 * @param r - 红色通道 (0-255)
 * @param g - 绿色通道 (0-255)
 * @param b - 蓝色通道 (0-255)
 * @returns 十六进制颜色字符串 (例如: '#ff00aa')
 */
export function rgbToHex(r: number, g: number, b: number): string {
  return '#' + [r, g, b].map(x => {
    // 限制在 0-255 范围内并转换为十六进制
    const hex = Math.round(Math.max(0, Math.min(255, x))).toString(16);
    // 如果只有一位，前面补0
    return hex.length === 1 ? '0' + hex : hex;
  }).join('');
}

/**
 * 计算颜色的相对亮度 (0-1)
 * 基于 WCAG 2.0 标准公式
 * 
 * @param hex - 十六进制颜色字符串
 * @returns 亮度值 (0=最暗, 1=最亮)
 */
export function getLuminance(hex: string): number {
  const rgb = hexToRgb(hex);
  if (!rgb) return 0;

  // 将 RGB 值转换为线性光强度值
  const [r, g, b] = [rgb.r, rgb.g, rgb.b].map(v => {
    v /= 255;  // 归一化到 0-1
    // 应用 sRGB 到线性 RGB 的转换
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  });

  // 计算相对亮度（加权和）
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/**
 * 检查颜色是否为"深色" (亮度 < 0.5)
 * @param hex - 十六进制颜色字符串
 * @returns true 表示深色，false 表示浅色
 */
export function isDarkColor(hex: string): boolean {
  return getLuminance(hex) < 0.5;
}

/**
 * 检查颜色是否为"浅色" (亮度 >= 0.5)
 * @param hex - 十六进制颜色字符串
 * @returns true 表示浅色，false 表示深色
 */
export function isLightColor(hex: string): boolean {
  return getLuminance(hex) >= 0.5;
}

/**
 * 根据背景颜色获取对比度良好的网格颜色
 * 确保网格在任何背景下都清晰可见
 * 
 * @param backgroundColor - 背景颜色的十六进制字符串
 * @returns 包含主网格和次网格颜色的对象
 */
export function getContrastingGridColors(backgroundColor: string): {
  gridColor: string;
  subGridColor: string;
} {
  const luminance = getLuminance(backgroundColor);
  
  if (luminance < 0.3) {
    // 非常深的背景 - 使用浅色网格
    return {
      gridColor: 'rgba(255, 255, 255, 0.25)',      // 主网格：白色，25% 透明度
      subGridColor: 'rgba(255, 255, 255, 0.12)',   // 次网格：白色，12% 透明度
    };
  } else if (luminance < 0.5) {
    // 深色背景 - 使用较浅的网格
    return {
      gridColor: 'rgba(255, 255, 255, 0.2)',
      subGridColor: 'rgba(255, 255, 255, 0.1)',
    };
  } else if (luminance < 0.7) {
    // 浅色背景 - 使用较深的网格
    return {
      gridColor: 'rgba(0, 0, 0, 0.15)',
      subGridColor: 'rgba(0, 0, 0, 0.08)',
    };
  } else {
    // 非常浅的背景 - 使用深色网格
    return {
      gridColor: 'rgba(0, 0, 0, 0.2)',             // 主网格：黑色，20% 透明度
      subGridColor: 'rgba(0, 0, 0, 0.1)',          // 次网格：黑色，10% 透明度
    };
  }
}

/**
 * 根据背景颜色获取对比度良好的坐标轴颜色
 * 确保坐标轴和标签在任何背景下都清晰可见
 * 
 * @param backgroundColor - 背景颜色的十六进制字符串
 * @returns 包含轴线、刻度和标签颜色的对象
 */
export function getContrastingAxisColors(backgroundColor: string): {
  axisColor: string;
  tickColor: string;
  labelColor: string;
} {
  const luminance = getLuminance(backgroundColor);
  
  if (luminance < 0.4) {
    // 深色背景 - 使用浅色坐标轴
    return {
      axisColor: 'rgba(255, 255, 255, 0.7)',      // 轴线：白色，70% 透明度
      tickColor: 'rgba(255, 255, 255, 0.6)',      // 刻度：白色，60% 透明度
      labelColor: 'rgba(255, 255, 255, 0.85)',    // 标签：白色，85% 透明度
    };
  } else {
    // 浅色背景 - 使用深色坐标轴
    return {
      axisColor: 'rgba(100, 100, 100, 0.9)',      // 轴线：灰色，90% 透明度
      tickColor: 'rgba(80, 80, 80, 0.8)',         // 刻度：深灰色，80% 透明度
      labelColor: 'rgba(60, 60, 60, 1)',          // 标签：更深灰色，不透明
    };
  }
}

/**
 * 混合两种颜色
 * @param color1 - 第一种颜色（十六进制）
 * @param color2 - 第二种颜色（十六进制）
 * @param ratio - 混合比例 (0=完全是color1, 1=完全是color2)
 * @returns 混合后的颜色（十六进制）
 */
export function blendColors(color1: string, color2: string, ratio: number): string {
  const rgb1 = hexToRgb(color1);
  const rgb2 = hexToRgb(color2);
  
  if (!rgb1 || !rgb2) return color1;
  
  // 对每个颜色通道进行线性插值
  const r = Math.round(rgb1.r * (1 - ratio) + rgb2.r * ratio);
  const g = Math.round(rgb1.g * (1 - ratio) + rgb2.g * ratio);
  const b = Math.round(rgb1.b * (1 - ratio) + rgb2.b * ratio);
  
  return rgbToHex(r, g, b);
}
