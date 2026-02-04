/**
 * 背景音：类型与常量（跨端通用）。
 * Web 端实现见 web/backgroundSoundAdapter，由 Web 端调用。
 */

export type BackgroundSoundType =
  | 'ocean'
  | 'white-noise'
  | 'pink-noise'
  | 'rain'
  | '';

/** 可选固定频率（Hz），0 表示关 */
export const TONE_FREQUENCY_OPTIONS: { value: number; label: string }[] = [
  { value: 0, label: '关' },
  { value: 256, label: '256 Hz' },
  { value: 432, label: '432 Hz' },
  { value: 528, label: '528 Hz' },
  { value: 639, label: '639 Hz' },
];

/** 背景音选项（供 UI 多选用） */
export const BACKGROUND_SOUND_OPTIONS: {
  value: BackgroundSoundType;
  label: string;
}[] = [
  { value: 'ocean', label: '海浪' },
  { value: 'rain', label: '雨声' },
  { value: 'white-noise', label: '白噪声' },
  { value: 'pink-noise', label: '粉红噪声' },
];

/** 默认基调：开关与频率（Hz），供各端适配层使用 */
export const DEFAULT_TONE_ENABLED = true;
export const DEFAULT_TONE_FREQUENCY_HZ = 432;

/**
 * 根据 enabled 与 types 得到有效背景音类型列表（跨端共用）。
 */
export function getEffectiveBackgroundSoundTypes(
  types: BackgroundSoundType[],
  enabled: boolean
): Exclude<BackgroundSoundType, ''>[] {
  return enabled
    ? types.filter((t): t is Exclude<BackgroundSoundType, ''> => t !== '')
    : [];
}

/**
 * 规范化基调频率：≤0 视为关，返回 0；否则返回原值。
 */
export function normalizeToneFrequency(hz: number): number {
  return hz <= 0 ? 0 : hz;
}

/** 有效（非空）背景音类型列表，用于校验持久化/输入（跨端共用） */
const NON_EMPTY_TYPES: Exclude<BackgroundSoundType, ''>[] = [
  'ocean',
  'rain',
  'white-noise',
  'pink-noise',
];

/** 有效背景音类型集合，用于 O(1) 校验 */
export const VALID_NON_EMPTY_BACKGROUND_SOUND_TYPES = new Set<
  Exclude<BackgroundSoundType, ''>
>(NON_EMPTY_TYPES);

/**
 * 校验字符串是否为有效（非空）背景音类型。
 */
export function isValidBackgroundSoundType(
  t: string
): t is Exclude<BackgroundSoundType, ''> {
  return VALID_NON_EMPTY_BACKGROUND_SOUND_TYPES.has(
    t as Exclude<BackgroundSoundType, ''>
  );
}

/**
 * 取「主」背景音类型：即有效类型列表中的第一个，供单轨播放端（如 native）使用。
 * 无有效类型时返回 null。
 */
export function getPrimaryBackgroundSoundType(
  types: BackgroundSoundType[],
  enabled: boolean
): Exclude<BackgroundSoundType, ''> | null {
  const effective = getEffectiveBackgroundSoundTypes(types, enabled);
  return effective.length > 0 ? effective[0] : null;
}

/** 基调音量相对背景音的比例（供 Web 等有基调的端使用） */
export const TONE_GAIN_RATIO = 0.08;

/** 非 Web 端为 no-op；Web 端请使用 web/backgroundSoundAdapter */
export function setBackgroundSound(
  _types: BackgroundSoundType[],
  _enabled: boolean
): void {}

export function getToneEnabled(): boolean {
  return false;
}

export function getToneFrequency(): number {
  return 0;
}

/** 非 Web 端为 no-op */
export function setTone(_enabled: boolean, _frequencyHz: number): void {}

/** 非 Web 端为 no-op */
export function resumeBackgroundSoundContext(): void {}
