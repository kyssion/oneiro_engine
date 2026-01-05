/**
 * 统一处理整个canvas画板中所有的事件处理
 */

// 定义一个通用方法的接口
interface Loggable {
    log(): void;
}

interface Timestamped {
    timestamp: Date;
    addTimestamp(): void;
}

// 创建一个提供 "log" 方法实现的混入
function LoggableMixin<T extends new (...args: any[]) => {}>(Base: T) {
    return class extends Base implements Loggable {
        log(): void {
            console.log(`Log: ${this.constructor.name} - ${JSON.stringify(this)}`);
        }
    };
}

// 创建一个提供 "addTimestamp" 方法实现的混入
function TimestampedMixin<T extends new (...args: any[]) => {}>(Base: T) {
    return class extends Base implements Timestamped {
        timestamp: Date = new Date(); // 默认值

        addTimestamp(): void {
            this.timestamp = new Date();
        }
    };
}

// 定义一个基础类
class Vehicle {
    constructor(public brand: string) {}
}

// 使用混入组合功能
class Car extends LoggableMixin(TimestampedMixin(Vehicle)) {
    constructor(brand: string, public model: string) {
        super(brand);
    }
}

// 现在 Car 实例拥有了来自混入的所有方法和属性
const myCar = new Car("Toyota", "Camry");
myCar.addTimestamp(); // 来自 TimestampedMixin
myCar.log();          // 来自 LoggableMixin
console.log(myCar.timestamp); // 来自 TimestampedMixin