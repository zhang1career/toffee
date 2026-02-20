/**
 * 蠕性随机：在时间序列上有一定概率重复前一个结果的随机选择
 *
 * 给定样本集合，每次调用时：
 * - 以 repeatProbability 的概率返回上一次的结果（若有）
 * - 以 (1 - repeatProbability) 的概率从样本中均匀随机选取
 *
 * 例：样本 {1,2,3,4}，repeatProbability=0.5 时，可能得到 2,2,3,3,3,1,1,4
 *
 * @param samples 样本集合，非空
 * @param repeatProbability 重复概率，0~1；越大则连续相同结果越多
 * @returns 每次调用返回下一个蠕性随机选取的样本
 */
export function createViscousRandomPicker<T>(
  samples: readonly T[],
  repeatProbability = 0.5
): () => T {
  if (!samples || samples.length === 0) {
    throw new Error('createViscousRandomPicker: samples must be non-empty');
  }

  const arr = [...samples];
  let last: T | null = null;
  const p = Math.max(0, Math.min(1, repeatProbability));

  return function next(): T {
    const shouldRepeat = last !== null && Math.random() < p;
    if (shouldRepeat) {
      return last as T;
    }
    const idx = Math.floor(Math.random() * arr.length);
    const chosen = arr[idx] as T;
    last = chosen;
    return chosen;
  };
}
