import type { MessageTable, MessagesByLocale, SupportedLocale } from './interface';

export type Translator<M extends MessageTable> = {
  /** 当前解析使用的语言 */
  locale: SupportedLocale;
  /** 取文案；缺 key 时回退到 fallback locale，再缺则返回 key 本身 */
  t: (key: keyof M & string) => string;
};

/**
 * 根据各语言文案表创建 getTranslator(locale)，无 React 依赖，可在任意包使用。
 */
export function createTranslator<M extends MessageTable>(
  messagesByLocale: MessagesByLocale<M>,
  options?: { fallback?: SupportedLocale }
): { getTranslator: (locale: SupportedLocale) => Translator<M> } {
  const fallback = options?.fallback ?? 'zh-CN';

  function getTranslator(locale: SupportedLocale): Translator<M> {
    const table =
      (messagesByLocale[locale] ?? messagesByLocale[fallback]) as M;
    const fb = messagesByLocale[fallback] as M;

    function t(key: keyof M & string): string {
      const v = table[key];
      if (typeof v === 'string' && v.length > 0) return v;
      const v2 = fb[key];
      if (typeof v2 === 'string' && v2.length > 0) return v2;
      return key;
    }

    return { locale: messagesByLocale[locale] ? locale : fallback, t };
  }

  return { getTranslator };
}

/** 将 BCP 47 或系统 locale 粗映射到本包支持的语言 */
export function resolveSupportedLocale(
  tag: string | undefined | null,
  fallback: SupportedLocale = 'zh-CN'
): SupportedLocale {
  if (!tag || typeof tag !== 'string') return fallback;
  const lower = tag.toLowerCase();
  if (lower.startsWith('en')) return 'en';
  if (lower.startsWith('zh')) return 'zh-CN';
  return fallback;
}
