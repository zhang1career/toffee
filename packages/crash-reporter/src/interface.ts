/**
 * 崩溃日志类型
 */
export type CrashLogType = 'native' | 'js' | 'unhandled_promise';

/**
 * 崩溃日志数据结构
 */
export interface CrashLog {
  /** 崩溃唯一标识 */
  id: string;
  /** 崩溃类型 */
  type: CrashLogType;
  /** 崩溃时间戳（ISO 8601 格式） */
  timestamp: string;
  /** 崩溃消息/错误信息 */
  message: string;
  /** 堆栈信息 */
  stack?: string;
  /** 设备信息 */
  deviceInfo?: {
    /** iOS 版本 */
    iosVersion?: string;
    /** 设备型号 */
    deviceModel?: string;
    /** 应用版本 */
    appVersion?: string;
    /** 内存使用情况（MB） */
    memoryUsage?: number;
  };
  /** 额外信息（JSON 字符串） */
  extra?: string;
}

/**
 * 崩溃报告器配置选项
 */
export interface CrashReporterConfig {
  /** 是否启用原生崩溃捕获 */
  enableNativeCrashCapture?: boolean;
  /** 是否启用 JavaScript 错误捕获 */
  enableJSErrorCapture?: boolean;
  /** 日志保留天数（默认 30 天） */
  logRetentionDays?: number;
  /** 是否在开发模式下显示错误弹窗 */
  showErrorInDev?: boolean;
}

/**
 * 崩溃报告器接口
 */
export interface CrashReporter {
  /**
   * 初始化崩溃捕获
   * @param config 配置选项
   */
  initialize(config?: CrashReporterConfig): Promise<void>;

  /**
   * 获取所有崩溃日志
   * @returns 崩溃日志数组
   */
  getCrashLogs(): Promise<CrashLog[]>;

  /**
   * 获取最近一次崩溃日志
   * @returns 最近的崩溃日志，如果没有则返回 null
   */
  getLastCrashLog(): Promise<CrashLog | null>;

  /**
   * 清理所有崩溃日志
   */
  clearCrashLogs(): Promise<void>;

  /**
   * 手动记录一个错误（用于测试或手动捕获）
   * @param error 错误对象
   * @param type 错误类型
   */
  recordError(error: Error, type?: CrashLogType): Promise<void>;
}

