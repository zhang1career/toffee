import { TunerStore } from './store';
import type { TuningOptions } from './types';

/**
 * 类属性装饰器：将变量注册到 TunerStore，使抽屉显示滑动条或开关、调试窗口显示该变量
 * 数值 + 不传 type 或 type: 'slider' → 滑动条；布尔 + type: 'switch' → 开关
 * @param initialValue 初始值（number 或 boolean）
 * @param options 可选：type 'slider' | 'switch'，滑动条用 min/max/step，开关用 label
 */
export function tuning(initialValue: number, options?: TuningOptions): any;
export function tuning(
  initialValue: boolean,
  options?: { type: 'switch'; label?: string }
): any;
export function tuning(
  initialValue: number | boolean,
  options?: TuningOptions & { type?: 'slider' | 'switch'; label?: string }
): any {
  return function (_target: object, propertyKey: string): any {
    const kind = options?.type === 'switch' ? 'switch' : 'slider';
    TunerStore.register(propertyKey, initialValue, {
      type: kind,
      min: options?.min,
      max: options?.max,
      step: options?.step,
      label: options?.label,
    });
    return {
      configurable: true,
      enumerable: true,
      get() {
        return TunerStore.getValue(propertyKey) ?? initialValue;
      },
      set(value: number | boolean) {
        TunerStore.setValue(propertyKey, value);
      },
    };
  };
}
