/**
 * 从数组中随机取一个元素
 */
export function pickFromArray<T>(arr: readonly T[]): T | undefined {
  if (!arr || arr.length === 0) return undefined;
  return arr[Math.floor(Math.random() * arr.length)];
}

/** 冷/暖 tone 映射 */
export type ToneMap = { cold: string[]; warm: string[] };
export type SceneTone = 'cold' | 'warm';

/**
 * 按 tone 从 { cold, warm } 映射中随机取一个词
 */
export function pickFromTone<T extends ToneMap>(
  map: T,
  tone: SceneTone
): string | undefined {
  const arr = map[tone];
  return pickFromArray(arr);
}

/** 是否为 CJK 语境（中文/标点/全角，词间不加空格） */
export function hasCjk(s: string): boolean {
  return /[\u4e00-\u9fff\u3000-\u303f\uff00-\uffef]/.test(s);
}

/** 中文词间不加空格，非中文（如拉丁）用空格连接 */
export function joinWordsCjk(...parts: string[]): string {
  const sep = parts.length > 0 && parts.every((p) => hasCjk(p)) ? '' : ' ';
  return parts.join(sep);
}

/** 从数组中随机取两个不同元素；不足两个则返回 undefined */
export function pickTwoDistinct(
  arr: readonly string[]
): [string, string] | undefined {
  if (!arr || arr.length < 2) return undefined;
  const i = Math.floor(Math.random() * arr.length);
  let j = Math.floor(Math.random() * arr.length);
  while (j === i) j = Math.floor(Math.random() * arr.length);
  return [arr[i], arr[j]];
}
