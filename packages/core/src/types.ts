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

// 交互状态类型
export type InteractionState = 
  | 'idle'           // 空闲状态（显示深空背景）
  | 'showingGuide'   // 显示引导词
  | 'touchStart'     // 触摸开始（等待50ms阈值）
  | 'recording'      // 正在录音（持续状态，原 recordStart 重命名）
  | 'recordStop'     // 停止录音（瞬时状态）
  | 'playback'       // 正在播放
  | 'error';         // 错误状态

// 互斥锁接口
export interface MutexLock {
  acquire(): Promise<void>;
  release(): void;
}

// 交互状态机配置
export interface InteractionStateMachineConfig {
  idleTimeout: number;              // 空闲超时时间（毫秒）
  fadeTransitionDuration: number;  // 渐变过渡时间（毫秒）
  touchHoldThreshold: number;      // 按住时长阈值（毫秒）
  echoDisplayDuration: number;     // 回响文案显示时长（毫秒）
  playbackStartDelay?: number;     // 回放启动延迟（毫秒，默认50）
  echoHideDelay?: number;          // 回响文案隐藏延迟（毫秒，默认2000）
  maxRetryCount?: number;          // 最大重试次数（默认3）
  audioSessionCleanupDelay?: number; // 音频会话清理延迟（毫秒，默认75）
  audioSessionCleanupDelayFirst?: number; // 首次音频会话清理延迟（毫秒，默认100）
  errorRecoveryDelay?: number;     // 错误状态恢复延迟（毫秒，默认1000）
  enableStateTransitionLogging?: boolean; // 启用状态转换日志（默认false）
  enableStateTransitionValidation?: boolean; // 启用状态转换验证（默认true）
  minRecordingDurationForEcho?: number; // 显示回响文案所需的最小录音时长（毫秒，默认1000）
}

// 交互状态机回调接口
export interface InteractionCallbacks {
  onStateChange?: (oldState: InteractionState, newState: InteractionState) => void; // 状态转换回调（可选）
  onShowGuide: () => void;
  onHideGuide: () => void;
  onShowEcho: (count: number) => void;
  onHideEcho: () => void;
  onShowEffects: (x: number, y: number) => void;
  onHideEffects: () => void;
}

