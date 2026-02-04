/**
 * 可调变量的配置选项（用于 @tuning 装饰器）
 */
export interface TuningOptions {
  min?: number;
  max?: number;
  step?: number;
}

/**
 * Store 中的可调变量条目
 */
export interface TunableEntry {
  name: string;
  value: number;
  min?: number;
  max?: number;
  step?: number;
}
