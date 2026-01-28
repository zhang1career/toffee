import type {
  CrashReporter as ICrashReporter,
  CrashReporterConfig,
  CrashLog,
  CrashLogType,
} from './interface';
import { logger } from '@zhang1career/logger';

/**
 * Web 平台的崩溃报告器实现（存根）
 * 在 Web 平台上，崩溃监控功能有限，主要提供接口一致性
 */
class WebCrashReporter implements ICrashReporter {
  private initialized = false;

  async initialize(config: CrashReporterConfig = {}): Promise<void> {
    if (typeof window === 'undefined') {
      logger.warn('⚠️ CrashReporter: window is not available');
      return;
    }

    this.initialized = true;

    // Web 平台可以捕获 JavaScript 错误
    if (config.enableJSErrorCapture !== false) {
      this.setupJSErrorHandling(config);
    }

    logger.log('✅ CrashReporter initialized (Web platform)');
  }

  async getCrashLogs(): Promise<CrashLog[]> {
    // Web 平台从 localStorage 读取日志
    try {
      const logsJson = localStorage.getItem('crash_logs');
      if (!logsJson) {
        return [];
      }
      return JSON.parse(logsJson);
    } catch (error) {
      logger.error('❌ Failed to get crash logs:', error);
      return [];
    }
  }

  async getLastCrashLog(): Promise<CrashLog | null> {
    const logs = await this.getCrashLogs();
    return logs.length > 0 ? logs[0] : null;
  }

  async clearCrashLogs(): Promise<void> {
    try {
      localStorage.removeItem('crash_logs');
    } catch (error) {
      logger.error('❌ Failed to clear crash logs:', error);
      throw error;
    }
  }

  async recordError(error: Error, type: CrashLogType = 'js'): Promise<void> {
    try {
      const log: CrashLog = {
        id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        type,
        timestamp: new Date().toISOString(),
        message: error.message || 'Unknown error',
        stack: error.stack,
        deviceInfo: {
          appVersion: 'web',
        },
      };

      // 保存到 localStorage
      const logs = await this.getCrashLogs();
      logs.unshift(log); // 最新的在前

      // 限制日志数量（保留最近 50 条）
      const maxLogs = 50;
      if (logs.length > maxLogs) {
        logs.splice(maxLogs);
      }

      localStorage.setItem('crash_logs', JSON.stringify(logs));
    } catch (err) {
      logger.error('❌ Failed to record error:', err);
    }
  }

  /**
   * 设置 JavaScript 错误处理
   */
  private setupJSErrorHandling(config: CrashReporterConfig): void {
    // 全局错误处理
    window.addEventListener('error', (event) => {
      const error = new Error(event.message);
      error.stack = `${event.filename}:${event.lineno}:${event.colno}`;
      this.recordError(error, 'js').catch(logger.error);
    });

    // Promise 拒绝处理
    window.addEventListener('unhandledrejection', (event) => {
      const error = event.reason instanceof Error
        ? event.reason
        : new Error(String(event.reason));
      this.recordError(error, 'unhandled_promise').catch(logger.error);
    });
  }
}

// 导出单例实例
export const CrashReporter = new WebCrashReporter();

// 导出类型
export type { CrashReporterConfig, CrashLog, CrashLogType } from './interface';

