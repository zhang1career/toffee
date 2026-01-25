export interface AudioRecorder {
  start(): Promise<void>;
  stop(): Promise<Blob>;
  isRecording(): boolean;
}

export interface AudioPlayer {
  play(blob: Blob): Promise<void>;
  getDuration(blob: Blob): Promise<number>;
  isPlaying(): boolean;
  stop(): Promise<void>;
}

export interface MeteorConfig {
  duration: number; // 动画时长（秒）
  startX: number; // 起始 X 坐标（百分比）
  startY: number; // 起始 Y 坐标（百分比）
  endX: number; // 结束 X 坐标（百分比）
  endY: number; // 结束 Y 坐标（百分比）
}

// 涟漪效果配置
export interface RippleConfig {
  x: number; // 涟漪中心 X 坐标（百分比）
  y: number; // 涟漪中心 Y 坐标（百分比）
  timestamp: number; // 创建时间戳
}

// 语音消息
export interface VoiceMessage {
  id: string;
  blob: Blob;
  duration: number;
  timestamp: number;
}

// 网络服务接口
export interface NetworkService {
  sendVoice(blob: Blob, deviceId: string): Promise<{ listenerCount: number }>;
  receiveRandomVoice(deviceId: string): Promise<Blob | null>;
  getOnlineCount(): Promise<number>;
}

// 触觉反馈接口
export interface HapticService {
  vibrate(pattern: 'light' | 'medium' | 'heavy' | 'ripple' | 'resonance'): Promise<void>;
  startContinuous(pattern: 'resonance'): Promise<void>;
  stopContinuous(): void;
}

// 设备管理接口
export interface DeviceService {
  getDeviceId(): Promise<string>;
  isFirstLaunch(): Promise<boolean>;
}

// 互斥锁接口
export interface MutexLock {
  acquire(): Promise<void>;
  release(): void;
}
