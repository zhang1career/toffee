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
  touchDebounceThreshold: env.INTERACTION_TOUCH_DEBOUNCE_THRESHOLD 
    ? parseInt(env.INTERACTION_TOUCH_DEBOUNCE_THRESHOLD, 10)
    : defaultConfig.interaction.touchDebounceThreshold,
  playbackStartDelay: env.INTERACTION_PLAYBACK_START_DELAY
    ? parseInt(env.INTERACTION_PLAYBACK_START_DELAY, 10)
    : defaultConfig.interaction.playbackStartDelay,
  echoHideDelay: env.INTERACTION_ECHO_HIDE_DELAY
    ? parseInt(env.INTERACTION_ECHO_HIDE_DELAY, 10)
    : defaultConfig.interaction.echoHideDelay,
  maxRetryCount: env.INTERACTION_MAX_RETRY_COUNT
    ? parseInt(env.INTERACTION_MAX_RETRY_COUNT, 10)
    : defaultConfig.interaction.maxRetryCount,
  audioSessionCleanupDelay: env.INTERACTION_AUDIO_SESSION_CLEANUP_DELAY
    ? parseInt(env.INTERACTION_AUDIO_SESSION_CLEANUP_DELAY, 10)
    : defaultConfig.interaction.audioSessionCleanupDelay,
  audioSessionCleanupDelayFirst: env.INTERACTION_AUDIO_SESSION_CLEANUP_DELAY_FIRST
    ? parseInt(env.INTERACTION_AUDIO_SESSION_CLEANUP_DELAY_FIRST, 10)
    : defaultConfig.interaction.audioSessionCleanupDelayFirst,
  errorRecoveryDelay: env.INTERACTION_ERROR_RECOVERY_DELAY
    ? parseInt(env.INTERACTION_ERROR_RECOVERY_DELAY, 10)
    : defaultConfig.interaction.errorRecoveryDelay,
  enableStateTransitionLogging: env.INTERACTION_ENABLE_STATE_TRANSITION_LOGGING
    ? env.INTERACTION_ENABLE_STATE_TRANSITION_LOGGING === 'true'
    : defaultConfig.interaction.enableStateTransitionLogging,
  enableStateTransitionValidation: env.INTERACTION_ENABLE_STATE_TRANSITION_VALIDATION
    ? env.INTERACTION_ENABLE_STATE_TRANSITION_VALIDATION !== 'false'
    : defaultConfig.interaction.enableStateTransitionValidation,
  minRecordingDurationForEcho: env.INTERACTION_MIN_RECORDING_DURATION_FOR_ECHO
    ? parseInt(env.INTERACTION_MIN_RECORDING_DURATION_FOR_ECHO, 10)
    : defaultConfig.interaction.minRecordingDurationForEcho,
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

/**
 * 获取 APP_LOG_LEVEL 环境变量
 * @returns 'debug' | 'info' | 'warn' | 'error' | undefined
 */
export function getAppLogLevel(): string | undefined {
  return env.APP_LOG_LEVEL;
}
