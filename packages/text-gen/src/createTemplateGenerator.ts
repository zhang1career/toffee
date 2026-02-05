import { pickIndexWithLastPenalty } from '@zhang1career/random';
import { pickFromArray } from './utils';

export type TemplateRule = 'latin' | 'golden' | 'vocabulary';

export interface CreateTemplateGeneratorOptions<V, C> {
  /** 第一类模板（如自发态） */
  templatesCategory1: Array<(v: V, c: C) => string>;
  /** 第二类模板（如交互态/情境态） */
  templatesCategory2: Array<(v: V, c: C) => string>;
  /** 第一类被选中的概率（0~1） */
  category1Probability: number;
  /** 从词库取拉丁词列表 */
  getLatinWords: (v: V) => string[] | undefined;
  /** 从词库取金句/特殊句列表 */
  getSpecial: (v: V) => string[] | undefined;
  /** 仅拉丁词概率（0~1） */
  latinOnlyProb: number;
  /** 金句点缀概率（0~1） */
  goldenProb: number;
  /** 上次选中模板的权重倍数（默认 0.2） */
  lastPenaltyWeight?: number;
}

export interface TemplateGeneratorCallOptions {
  /** 本次调用允许的模式；未传或空则全部允许 */
  allowedModes?: TemplateRule[];
}

/**
 * 创建「词库 + 多模板」的随机文案生成器
 * @returns 生成函数 (vocabulary, context, callOptions?) => string
 */
export function createTemplateGenerator<V, C>(
  options: CreateTemplateGeneratorOptions<V, C>
): (vocabulary: V, context: C, callOptions?: TemplateGeneratorCallOptions) => string {
  const {
    templatesCategory1,
    templatesCategory2,
    category1Probability,
    getLatinWords,
    getSpecial,
    latinOnlyProb,
    goldenProb,
    lastPenaltyWeight = 0.2,
  } = options;

  let lastTemplatesRef: Array<(v: V, c: C) => string> | null = null;
  let lastTemplateIndex: number | null = null;

  return function generate(
    vocabulary: V,
    context: C,
    callOptions?: TemplateGeneratorCallOptions
  ): string {
    const allowed =
      callOptions?.allowedModes?.length != null && callOptions.allowedModes.length > 0
        ? new Set(callOptions.allowedModes)
        : null;

    const latin = getLatinWords(vocabulary);
    if (
      (!allowed || allowed.has('latin')) &&
      latin &&
      latin.length > 0 &&
      Math.random() < latinOnlyProb
    ) {
      const word = pickFromArray(latin);
      return word ?? '';
    }

    const special = getSpecial(vocabulary);
    if (
      (!allowed || allowed.has('golden')) &&
      special?.length &&
      Math.random() < goldenProb
    ) {
      const s = pickFromArray(special);
      if (s) return s;
    }

    if (!allowed || allowed.has('vocabulary')) {
      const templates =
        Math.random() < category1Probability ? templatesCategory1 : templatesCategory2;
      const effectiveLastIndex =
        lastTemplatesRef === templates ? lastTemplateIndex : null;
      const idx = pickIndexWithLastPenalty(templates, effectiveLastIndex, lastPenaltyWeight);
      const t = templates[idx];
      const main = t(vocabulary, context);
      if (main) {
        lastTemplatesRef = templates;
        lastTemplateIndex = idx;
        return main;
      }
    }

    if (!allowed || allowed.has('golden')) {
      const fallback = pickFromArray(special ?? []);
      if (fallback) return fallback;
    }
    return '';
  };
}
