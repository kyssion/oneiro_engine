/**
 * 设置一个通用的属性， 表示这个组件具有处理事件的能力
 */
export class CanvasEvent {

    // 鼠标滚轮事件（缩放）
    public handleWheel(_e: WheelEvent): void {}
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