/**
 * 可调变量的配置选项（用于 @tuning 装饰器）
 * type 默认不传或 'slider' 为数值滑动条，'switch' 为布尔开关
 */
export interface TuningOptions {
  /** 控件类型：默认 'slider'（数值滑动条），'switch' 为布尔开关 */
  type?: 'slider' | 'switch';
  /** 滑动条用：最小值 */
  min?: number;
  /** 滑动条用：最大值 */
  max?: number;
  /** 滑动条用：步长 */
  step?: number;
  /** 开关用：抽屉中显示文案，缺省用 name */
  label?: string;
}

/**
 * Store 中的可调变量条目
 * kind='slider' 为数值滑动条，kind='switch' 为布尔开关
 */
export interface TunableEntry {
  name: string;
  value: number | boolean;
  kind: 'slider' | 'switch';
  min?: number;
  max?: number;
  step?: number;
  label?: string;
}
