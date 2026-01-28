/**
 * 配置类型定义
 * 这些类型可以在公共库中使用
 */

export interface InteractionConfig {
  readonly idleTimeout: number;
  readonly fadeTransitionDuration: number;
  readonly touchHoldThreshold: number;
  readonly echoDisplayDuration: number;
  readonly touchDebounceThreshold?: number; // App层防抖阈值（默认500）
  readonly playbackStartDelay?: number; // 回放启动延迟（默认50）
  readonly echoHideDelay?: number; // 回响文案隐藏延迟（默认2000）
  readonly maxRetryCount?: number; // 最大重试次数（默认3）
  readonly audioSessionCleanupDelay?: number; // 音频会话清理延迟（默认75）
  readonly audioSessionCleanupDelayFirst?: number; // 首次音频会话清理延迟（默认100）
  readonly errorRecoveryDelay?: number; // 错误状态恢复延迟（默认1000）
  readonly enableStateTransitionLogging?: boolean; // 启用状态转换日志（默认false）
  readonly enableStateTransitionValidation?: boolean; // 启用状态转换验证（默认true）
  readonly minRecordingDurationForEcho?: number; // 显示回响文案所需的最小录音时长（毫秒，默认1000）
}

export interface MetroConfig {
  readonly defaultPort: number;
  readonly defaultHost: string;
  readonly bundleRoot: string;
  readonly bundleName: string;
  readonly bundleExtension: string;
}

export type { InteractionConfig as InteractionConfigType, MetroConfig as MetroConfigType };
