/**
 * 通用多语言：宿主应用提供各 locale 的扁平文案表，由 createTranslator 生成 t()。
 */
export type SupportedLocale = 'zh-CN' | 'en';

/** 扁平 key → 文案；各 locale 的 key 集合应一致，便于类型推断 */
export type MessageTable = Record<string, string>;

export type MessagesByLocale<M extends MessageTable> = Record<SupportedLocale, M>;
