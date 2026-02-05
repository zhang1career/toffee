/**
 * 从数组中按权重随机选取索引，对「上一次选中的索引」降权
 * @param arr 候选项数组
 * @param lastIndex 上一次选中的索引（null 表示无历史，不做降权）
 * @param lastWeight 上次选中项的权重倍数，默认 0.2（即 20%）
 * @returns 选中的索引；数组为空时返回 -1
 */
export function pickIndexWithLastPenalty<T>(
  arr: readonly T[],
  lastIndex: number | null,
  lastWeight = 0.2
): number {
  if (!arr || arr.length === 0) return -1;

  const weights = arr.map((_, i) =>
    lastIndex !== null && i === lastIndex ? lastWeight : 1
  );
  const total = weights.reduce((a, b) => a + b, 0);
  let r = Math.random() * total;

  for (let i = 0; i < arr.length; i++) {
    r -= weights[i];
    if (r <= 0) return i;
  }
  return arr.length - 1;
}
