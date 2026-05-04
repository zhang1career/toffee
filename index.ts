/**
 * Toffee - 跨端公共库
 * 
 * 统一导出所有子包
 */

// 核心功能
export * from '@zhang1career/core';

// UI 组件
export * from '@zhang1career/ui';

// 音频抽象层
export * from '@zhang1career/audio';

// 网络服务抽象层
export * from '@zhang1career/network';

// 触觉反馈抽象层
export * from '@zhang1career/haptic';

// 设备管理抽象层
export * from '@zhang1career/device';

// 配置加载器
export * from '@zhang1career/config';

// 通用 i18n（createTranslator、SupportedLocale 等）
export * from '@zhang1career/i18n';

// 崩溃监控
export * from '@zhang1career/crash-reporter';

// 通用通知（顶部条等）
export * from '@zhang1career/notifications';

// 随机散布工具
export * from '@zhang1career/random';

// 模板文案生成引擎
export * from '@zhang1career/text-gen';

// 文案时序展示（萤火虫）
export * from '@zhang1career/text-display';

// 规则引擎：通用步骤内容、规则配置与执行器
export * from '@zhang1career/rule-engine';
