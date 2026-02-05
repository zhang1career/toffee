/**
 * 单条文本的显示阶段（text display firefly）
 * - fade-in: 淡入中
 * - visible: 已完全显示
 * - fade-out: 淡出中（结束后从列表移除）
 */
export type Phase = 'fade-in' | 'visible' | 'fade-out';

export interface TextItem {
  id: number;
  text: string;
  position: { x: number; y: number };
  phase: Phase;
}

/**
 * text display firefly 的配置，由各端传入
 * - lifeMinMs / lifeMaxMs: 单条文案的显示时长（毫秒），含渐入、渐出；用于 cycle 定时器 life 区间
 * - idleMinMs / idleMaxMs: 文案间空档时长（毫秒），用于 cycle 定时器 idle 区间
 * - fadeInMs / fadeOutMs: 渐入/渐出动画时长（毫秒），仅用于各端渲染
 * - getText: 生成下一条文本内容
 * - getPosition: 生成下一条文本的位置
 * - shouldAddItem: 可选；返回 false 时不添加新文案（用于进入前台延迟等）
 */
export interface TextDisplayFireflyConfig {
  lifeMinMs: number;
  lifeMaxMs: number;
  idleMinMs: number;
  idleMaxMs: number;
  fadeInMs: number;
  fadeOutMs: number;
  getText: () => string | null;
  getPosition: () => { x: number; y: number };
  /** 可选；返回 false 时不添加新文案，且 onFadeOutEnd 后不自动续加 */
  shouldAddItem?: () => boolean;
}

export type TextDisplayFireflyListener = (items: readonly TextItem[]) => void;
