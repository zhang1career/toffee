import type { NetworkService } from '@zhang1career/core';

export interface NetworkAdapter {
  createService(baseUrl?: string): NetworkService;
}

// 确保文件有运行时代码，避免 Babel 处理后文件为空
export {};

