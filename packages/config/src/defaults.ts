/**
 * 配置默认值
 * 当环境变量未设置时使用这些默认值
 */
import type { InteractionConfig, MetroConfig } from './types';

export const defaultInteractionConfig: InteractionConfig = {
  idleTimeout: 5000,
  fadeTransitionDuration: 2000,
  touchHoldThreshold: 50,
  echoDisplayDuration: 3000,
} as const;

export const defaultMetroConfig: MetroConfig = {
  defaultPort: 8081,
  defaultHost: 'localhost',
  bundleRoot: 'index',
  bundleName: 'main',
  bundleExtension: 'jsbundle',
} as const;

export const defaultConfig = {
  interaction: defaultInteractionConfig,
  metro: defaultMetroConfig,
} as const;
