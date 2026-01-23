/**
 * React Native 平台环境变量加载器
 * 支持 react-native-config 或 process.env
 */

export interface EnvConfig {
  INTERACTION_IDLE_TIMEOUT?: string;
  INTERACTION_FADE_TRANSITION_DURATION?: string;
  INTERACTION_TOUCH_HOLD_THRESHOLD?: string;
  INTERACTION_ECHO_DISPLAY_DURATION?: string;
  METRO_DEFAULT_PORT?: string;
  METRO_DEFAULT_HOST?: string;
  METRO_BUNDLE_ROOT?: string;
  METRO_BUNDLE_NAME?: string;
  METRO_BUNDLE_EXTENSION?: string;
}

export function loadEnvConfig(): EnvConfig {
  // 尝试使用 react-native-config
  try {
    // @ts-expect-error - react-native-config 可能未安装，动态 require
    const Config = require('react-native-config');
    if (Config) {
      return {
        INTERACTION_IDLE_TIMEOUT: Config.INTERACTION_IDLE_TIMEOUT,
        INTERACTION_FADE_TRANSITION_DURATION: Config.INTERACTION_FADE_TRANSITION_DURATION,
        INTERACTION_TOUCH_HOLD_THRESHOLD: Config.INTERACTION_TOUCH_HOLD_THRESHOLD,
        INTERACTION_ECHO_DISPLAY_DURATION: Config.INTERACTION_ECHO_DISPLAY_DURATION,
        METRO_DEFAULT_PORT: Config.METRO_DEFAULT_PORT,
        METRO_DEFAULT_HOST: Config.METRO_DEFAULT_HOST,
        METRO_BUNDLE_ROOT: Config.METRO_BUNDLE_ROOT,
        METRO_BUNDLE_NAME: Config.METRO_BUNDLE_NAME,
        METRO_BUNDLE_EXTENSION: Config.METRO_BUNDLE_EXTENSION,
      };
    }
  } catch (e) {
    // react-native-config 未安装，继续使用 process.env
  }
  
  // 回退到 process.env
  if (typeof process !== 'undefined' && process.env) {
    return {
      INTERACTION_IDLE_TIMEOUT: process.env.INTERACTION_IDLE_TIMEOUT,
      INTERACTION_FADE_TRANSITION_DURATION: process.env.INTERACTION_FADE_TRANSITION_DURATION,
      INTERACTION_TOUCH_HOLD_THRESHOLD: process.env.INTERACTION_TOUCH_HOLD_THRESHOLD,
      INTERACTION_ECHO_DISPLAY_DURATION: process.env.INTERACTION_ECHO_DISPLAY_DURATION,
      METRO_DEFAULT_PORT: process.env.METRO_DEFAULT_PORT,
      METRO_DEFAULT_HOST: process.env.METRO_DEFAULT_HOST,
      METRO_BUNDLE_ROOT: process.env.METRO_BUNDLE_ROOT,
      METRO_BUNDLE_NAME: process.env.METRO_BUNDLE_NAME,
      METRO_BUNDLE_EXTENSION: process.env.METRO_BUNDLE_EXTENSION,
    };
  }
  
  return {};
}
