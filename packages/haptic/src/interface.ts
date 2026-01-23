import { HapticService } from '@toffee/core';

export interface HapticAdapter {
  createService(): HapticService;
}

// 确保文件有运行时代码，避免 Babel 处理后文件为空
export {};

