import { TunerStore } from './store';
import type { TuningOptions } from './types';

/**
 * 类属性装饰器：将变量注册到 TunerStore，使抽屉显示滑动条、调试窗口显示该变量
 * @param initialValue 初始值（默认值）
 * @param options 可选：min, max, step
 */
export function tuning(initialValue: number, options?: TuningOptions) {
  return function (_target: object, propertyKey: string): any {
    TunerStore.register(propertyKey, initialValue, options);
    return {
      configurable: true,
      enumerable: true,
      get() {
        return TunerStore.getValue(propertyKey) ?? initialValue;
      },
      set(value: number) {
        TunerStore.setValue(propertyKey, value);
      },
    };
  };
}
