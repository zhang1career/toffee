/**
 * 配置类型定义
 * 这些类型可以在公共库中使用
 */

export interface InteractionConfig {
  readonly idleTimeout: number;
  readonly fadeTransitionDuration: number;
  readonly touchHoldThreshold: number;
  readonly echoDisplayDuration: number;
}

export interface MetroConfig {
  readonly defaultPort: number;
  readonly defaultHost: string;
  readonly bundleRoot: string;
  readonly bundleName: string;
  readonly bundleExtension: string;
}

export type { InteractionConfig as InteractionConfigType, MetroConfig as MetroConfigType };
