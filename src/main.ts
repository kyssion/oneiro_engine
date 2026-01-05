/**
 * 导入样式文件
 */
import './styles/main.css';
import {App} from "@/core/App.ts";

/**
 * 应用初始化
 * 当 DOM 加载完成后创建应用实例
 */
document.addEventListener('DOMContentLoaded', () => {
  new App();
});
