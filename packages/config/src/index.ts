/**
 * Echo 跨端应用共享配置
 * 从环境变量读取配置，提供默认值作为 fallback
 * 
 * 通用配置（可加入公共库）：
 * - INTERACTION_CONFIG: 交互配置
 * - METRO_CONFIG: Metro 配置
 * 
 * 业务特定配置已移到应用层（apps/xxx/src/config/app.ts）
 */

import { loadEnvConfig } from './loaders';
import { defaultConfig } from './defaults';
import type { InteractionConfig, MetroConfig } from './types';

// 从环境变量加载配置
const env = loadEnvConfig();

/**
 * 交互配置
 * 从环境变量读取，未设置时使用默认值
 */
export const INTERACTION_CONFIG: InteractionConfig = {
  idleTimeout: parseInt(
    env.INTERACTION_IDLE_TIMEOUT || String(defaultConfig.interaction.idleTimeout),
    10
  ),
  fadeTransitionDuration: parseInt(
    env.INTERACTION_FADE_TRANSITION_DURATION || String(defaultConfig.interaction.fadeTransitionDuration),
    10
  ),
  touchHoldThreshold: parseInt(
    env.INTERACTION_TOUCH_HOLD_THRESHOLD || String(defaultConfig.interaction.touchHoldThreshold),
    10
  ),
  echoDisplayDuration: parseInt(
    env.INTERACTION_ECHO_DISPLAY_DURATION || String(defaultConfig.interaction.echoDisplayDuration),
    10
  ),
} as const;

/**
 * Metro 配置
 * 从环境变量读取，未设置时使用默认值
 */
export const METRO_CONFIG: MetroConfig = {
  defaultPort: parseInt(
    env.METRO_DEFAULT_PORT || String(defaultConfig.metro.defaultPort),
    10
  ),
  defaultHost: env.METRO_DEFAULT_HOST || defaultConfig.metro.defaultHost,
  bundleRoot: env.METRO_BUNDLE_ROOT || defaultConfig.metro.bundleRoot,
  bundleName: env.METRO_BUNDLE_NAME || defaultConfig.metro.bundleName,
  bundleExtension: env.METRO_BUNDLE_EXTENSION || defaultConfig.metro.bundleExtension,
} as const;

// 导出类型
export type { InteractionConfig, MetroConfig } from './types';
export type { InteractionConfig as InteractionConfigType, MetroConfig as MetroConfigType } from './types';

// 导出默认值（供测试或其他用途）
export { defaultConfig, defaultInteractionConfig, defaultMetroConfig } from './defaults';
