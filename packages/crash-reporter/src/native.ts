import { NativeModules, Platform } from 'react-native';
import type {
  CrashReporter,
  CrashReporterConfig,
  CrashLog,
  CrashLogType,
} from './interface';

// React Native 会自动去掉 RCT 前缀，所以模块名是 CrashReporter
// 但为了兼容，我们也尝试 RCTCrashReporter
const CrashReporterModule = NativeModules.CrashReporter || NativeModules.RCTCrashReporter;

// 检查模块是否可用
const isAvailable = CrashReporterModule != null;

// 在开发模式下，如果模块不可用，提供诊断信息
if (!isAvailable) {
  console.debug('⚠️ CrashReporter native module is not available');
  console.debug('   Available native modules:', Object.keys(NativeModules).join(', '));
  console.debug('   This is expected if:');
  console.debug('   1. Native files are not added to Xcode project');
  console.debug('   2. Project needs to be rebuilt');
  console.debug('   3. Running in development mode before first build');
  console.debug('   Solution: Clean and rebuild the iOS project in Xcode');
}

/**
 * React Native 平台的崩溃报告器实现
 */
class NativeCrashReporter implements CrashReporter {
  private initialized = false;
  private config: CrashReporterConfig = {};

  async initialize(config: CrashReporterConfig = {}): Promise<void> {
    if (!isAvailable) {
      console.debug('⚠️ CrashReporter native module is not available');
      console.debug('   Crash reporting will be disabled. To enable:');
      console.debug('   1. Ensure native files are added to Xcode project');
      console.debug('   2. Clean build folder (Cmd+Shift+K)');
      console.debug('   3. Rebuild the project');
      return;
    }

    this.config = {
      enableNativeCrashCapture: true,
      enableJSErrorCapture: true,
      logRetentionDays: 30,
      showErrorInDev: false,
      ...config,
    };

    try {
      // 初始化原生崩溃捕获
      await CrashReporterModule.initialize(this.config);
      this.initialized = true;

      // 设置 JavaScript 错误捕获
      if (this.config.enableJSErrorCapture) {
        this.setupJSErrorHandling();
      }

      console.log('✅ CrashReporter initialized');
    } catch (error) {
      console.debug('❌ Failed to initialize CrashReporter:', error);
      throw error;
    }
  }

  async getCrashLogs(): Promise<CrashLog[]> {
    if (!isAvailable) {
      return [];
    }

    try {
      const logs = await CrashReporterModule.getCrashLogs();
      return logs || [];
    } catch (error) {
      console.error('❌ Failed to get crash logs:', error);
      return [];
    }
  }

  async getLastCrashLog(): Promise<CrashLog | null> {
    if (!isAvailable) {
      return null;
    }

    try {
      const log = await CrashReporterModule.getLastCrashLog();
      return log === null ? null : log;
    } catch (error) {
      console.error('❌ Failed to get last crash log:', error);
      return null;
    }
  }

  async clearCrashLogs(): Promise<void> {
    if (!isAvailable) {
      return;
    }

    try {
      await CrashReporterModule.clearCrashLogs();
    } catch (error) {
      console.error('❌ Failed to clear crash logs:', error);
      throw error;
    }
  }

  async recordError(error: Error, type: CrashLogType = 'js'): Promise<void> {
    if (!isAvailable) {
      console.warn('⚠️ CrashReporter native module is not available, cannot record error');
      return;
    }

    try {
      const message = error.message || 'Unknown error';
      const stack = error.stack || 'No stack trace available';

      await CrashReporterModule.recordError(message, stack, type);
    } catch (err) {
      console.error('❌ Failed to record error:', err);
    }
  }

  /**
   * 设置 JavaScript 错误处理
   */
  private setupJSErrorHandling(): void {
    // 检查 ErrorUtils 是否可用
    const ErrorUtils = (global as any).ErrorUtils;
    if (!ErrorUtils) {
      console.warn('⚠️ ErrorUtils is not available, JS error handling may be limited');
      return;
    }

    // 保存原有的错误处理器
    const originalHandler = ErrorUtils.getGlobalHandler();

    // 设置全局错误处理器
    ErrorUtils.setGlobalHandler((error: Error, isFatal?: boolean) => {
      // 记录错误
      this.recordError(error, 'js').catch((err) => {
        console.error('Failed to record JS error:', err);
      });

      // 在开发模式下显示错误
      if (__DEV__ && this.config.showErrorInDev) {
        console.error('❌ Global Error Handler:', error);
        if (isFatal) {
          console.error('⚠️ This is a fatal error');
        }
      }

      // 调用原有的错误处理器
      if (originalHandler) {
        originalHandler(error, isFatal);
      } else {
        // 如果没有原有处理器，至少输出到控制台
        console.error('Unhandled error:', error);
      }
    });

    // 捕获未处理的 Promise 拒绝
    if (typeof global !== 'undefined') {
      const originalUnhandledRejection = (global as any).onunhandledrejection;

      (global as any).onunhandledrejection = (event: PromiseRejectionEvent) => {
        const error = event.reason instanceof Error
          ? event.reason
          : new Error(String(event.reason));

        // 记录错误
        this.recordError(error, 'unhandled_promise').catch((err) => {
          console.error('Failed to record unhandled promise rejection:', err);
        });

        // 在开发模式下显示错误
        if (__DEV__ && this.config.showErrorInDev) {
          console.error('❌ Unhandled Promise Rejection:', error);
        }

        // 调用原有的处理器
        if (originalUnhandledRejection) {
          originalUnhandledRejection(event);
        }
      };
    }
  }
}

// 导出单例实例
export const CrashReporter = new NativeCrashReporter();

// 导出类型
export type { CrashReporterConfig, CrashLog, CrashLogType } from './interface';

