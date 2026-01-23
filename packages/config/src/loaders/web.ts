/**
 * Web 平台环境变量加载器
 * 使用 Vite 的 import.meta.env
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
  // 在 Web 环境中，Vite 使用 import.meta.env
  // 检查是否在浏览器环境
  if (typeof window !== 'undefined' && (window as any).__ENV__) {
    return (window as any).__ENV__;
  }
  
  // 回退到 process.env（Node.js 环境或构建时）
  if (typeof process !== 'undefined' && process.env) {
    return {
      INTERACTION_IDLE_TIMEOUT: process.env.INTERACTION_IDLE_TIMEOUT || process.env.VITE_INTERACTION_IDLE_TIMEOUT,
      INTERACTION_FADE_TRANSITION_DURATION: process.env.INTERACTION_FADE_TRANSITION_DURATION || process.env.VITE_INTERACTION_FADE_TRANSITION_DURATION,
      INTERACTION_TOUCH_HOLD_THRESHOLD: process.env.INTERACTION_TOUCH_HOLD_THRESHOLD || process.env.VITE_INTERACTION_TOUCH_HOLD_THRESHOLD,
      INTERACTION_ECHO_DISPLAY_DURATION: process.env.INTERACTION_ECHO_DISPLAY_DURATION || process.env.VITE_INTERACTION_ECHO_DISPLAY_DURATION,
      METRO_DEFAULT_PORT: process.env.METRO_DEFAULT_PORT || process.env.VITE_METRO_DEFAULT_PORT,
      METRO_DEFAULT_HOST: process.env.METRO_DEFAULT_HOST || process.env.VITE_METRO_DEFAULT_HOST,
      METRO_BUNDLE_ROOT: process.env.METRO_BUNDLE_ROOT || process.env.VITE_METRO_BUNDLE_ROOT,
      METRO_BUNDLE_NAME: process.env.METRO_BUNDLE_NAME || process.env.VITE_METRO_BUNDLE_NAME,
      METRO_BUNDLE_EXTENSION: process.env.METRO_BUNDLE_EXTENSION || process.env.VITE_METRO_BUNDLE_EXTENSION,
    };
  }
  
  return {};
}
