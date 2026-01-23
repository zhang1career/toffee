/**
 * 环境变量加载器选择器
 * 根据运行环境自动选择合适的加载器
 */

import { loadEnvConfig as loadWebEnv } from './web';
import { loadEnvConfig as loadNativeEnv } from './native';
import { loadEnvConfig as loadTaroEnv } from './taro';

export type { EnvConfig } from './web';

/**
 * 检测当前运行平台并加载环境变量
 */
export function loadEnvConfig() {
  // 检测 React Native 环境
  if (typeof navigator !== 'undefined' && (navigator as any).product === 'ReactNative') {
    return loadNativeEnv();
  }
  
  // 检测 Taro 环境
  if (typeof process !== 'undefined' && process.env && process.env.TARO_ENV) {
    return loadTaroEnv();
  }
  
  // 检测 Web 环境
  if (typeof window !== 'undefined') {
    return loadWebEnv();
  }
  
  // 默认使用 Web 加载器（Node.js 环境）
  return loadWebEnv();
}
