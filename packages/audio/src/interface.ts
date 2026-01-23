import { AudioRecorder, AudioPlayer } from '@toffee/core';

export interface AudioAdapter {
  createRecorder(): AudioRecorder;
  createPlayer(): AudioPlayer;
}

// 确保文件有运行时代码，避免 Babel 处理后文件为空
export {};

