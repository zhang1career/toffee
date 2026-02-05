/**
 * 创建「与最近 N 个位置保持最小距离」的随机位置生成器
 * @param options 区域与约束参数
 * @returns 每次调用返回满足最小距离约束的 { x, y }
 */
export interface CreateGetRandomPositionWithMinDistanceOptions {
  /** 可放置区域宽度 */
  width: number;
  /** 可放置区域高度 */
  height: number;
  /** 四边留白，默认 60 */
  padding?: number;
  /** 与最近 N 个位置的最小欧氏距离（像素），默认 120 */
  minDistance?: number;
  /** 保留的最近位置数量，默认 5 */
  historySize?: number;
  /** 估算的文案宽度（用于计算有效区域），默认 240 */
  estimatedItemWidth?: number;
  /** 估算的文案高度（用于计算有效区域），默认 80 */
  estimatedItemHeight?: number;
}

export function createGetRandomPositionWithMinDistance(
  options: CreateGetRandomPositionWithMinDistanceOptions
): () => { x: number; y: number } {
  const {
    width,
    height,
    padding = 60,
    minDistance = 120,
    historySize = 5,
    estimatedItemWidth = 240,
    estimatedItemHeight = 80,
  } = options;

  const lastPositions: Array<{ x: number; y: number }> = [];
  const sqMinDist = minDistance * minDistance;

  return function getRandomPositionWithMinDistance(): { x: number; y: number } {
    const maxX = Math.max(0, width - estimatedItemWidth);
    const maxY = Math.max(0, height - estimatedItemHeight);
    const rangeX = Math.max(0, maxX - padding * 2);
    const rangeY = Math.max(0, maxY - padding * 2);
    const baseX = padding;
    const baseY = padding;

    const history = lastPositions.slice(-historySize);
    const maxAttempts = 100;

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      const x = baseX + Math.random() * rangeX;
      const y = baseY + Math.random() * rangeY;

      const tooClose = history.some((p) => {
        const dx = x - p.x;
        const dy = y - p.y;
        return dx * dx + dy * dy < sqMinDist;
      });

      if (!tooClose) {
        lastPositions.push({ x, y });
        if (lastPositions.length > historySize * 2) {
          lastPositions.splice(0, lastPositions.length - historySize);
        }
        return { x, y };
      }
    }

    // 达到最大尝试次数仍无法满足约束时，返回随机位置
    const x = baseX + Math.random() * rangeX;
    const y = baseY + Math.random() * rangeY;
    lastPositions.push({ x, y });
    if (lastPositions.length > historySize * 2) {
      lastPositions.splice(0, lastPositions.length - historySize);
    }
    return { x, y };
  };
}
