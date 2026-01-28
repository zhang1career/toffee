/**
 * 日志过滤工具
 * 根据 APP_LOG_LEVEL 环境变量过滤日志
 * 支持跨平台（Web、React Native、Taro）
 */

import {getAppLogLevel} from '@zhang1career/config';

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

/**
 * 获取当前日志级别
 */
function getCurrentLogLevel(): LogLevel {
  let level = getAppLogLevel();

  // Fallback: 如果 getAppLogLevel() 返回 undefined，在 React Native 环境中直接从 react-native-config 读取
  if (!level) {
    if (isReactNative()) {
      try {
        // ts-expect-error - react-native-config 可能未安装，动态 require
        const ConfigModule = require('react-native-config');
        
        // react-native-config 可能导出为 { default: {...}, Config: {...} } 结构
        // 尝试多种方式访问
        let actualConfig = ConfigModule;
        if (ConfigModule && ConfigModule.default) {
          actualConfig = ConfigModule.default;
        } else if (ConfigModule && ConfigModule.Config) {
          actualConfig = ConfigModule.Config;
        }
        
        if (actualConfig && actualConfig.APP_LOG_LEVEL) {
          level = actualConfig.APP_LOG_LEVEL;
        }
      } catch (e) {
        // 忽略错误，保持 level 为 undefined
        logger.warn('[logger] Failed to load react-native-config:', e);
      }
    }
  }
  
  if (level && ['debug', 'info', 'warn', 'error'].includes(level)) {
    return level as LogLevel;
  }
  // 默认返回 'info'
  return 'info';
}

/**
 * 检查指定级别的日志是否应该显示
 */
function shouldLog(level: LogLevel): boolean {
  const currentLevel = getCurrentLogLevel();
  return LOG_LEVELS[level] >= LOG_LEVELS[currentLevel];
}

/**
 * 检测是否为 React Native 环境
 */
function isReactNative(): boolean {
  return typeof navigator !== 'undefined' && 
    (navigator as any).product === 'ReactNative';
}

/**
 * 创建过滤后的日志函数
 */
function createLogger(originalFn: typeof console.debug, level: LogLevel) {
  return (...args: unknown[]) => {
    if (shouldLog(level)) {
      // 在 React Native 中，debug 级别使用 console.log 而不是 console.debug
      // 因为 console.debug 在 iOS 中不会输出到 Xcode 控制台
      if (isReactNative() && level === 'debug') {
        console.log(...args);
      } else {
        originalFn(...args);
      }
    }
  };
}

/**
 * 过滤后的 console 对象
 */
export const logger = {
  debug: createLogger(console.debug, 'debug'),
  info: createLogger(console.info, 'info'),
  log: createLogger(console.log, 'info'),
  warn: createLogger(console.warn, 'warn'),
  error: createLogger(console.error, 'error'),
};
