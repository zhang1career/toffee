/**
 * Echo 应用统一错误码和错误信息
 * 供所有平台（Web、iOS、Android、小程序）使用
 */

// 错误码枚举
export enum ErrorCode {
  // 应用初始化错误 (1xxx)
  APP_INIT_FAILED = 1001,
  PLATFORM_INIT_FAILED = 1002,
  
  // Bundle/资源加载错误 (2xxx)
  BUNDLE_URL_NOT_AVAILABLE = 2001,
  BUNDLE_LOAD_FAILED = 2002,
  MAIN_BUNDLE_NOT_FOUND = 2003,
  
  // 音频相关错误 (3xxx)
  AUDIO_RECORD_START_FAILED = 3001,
  AUDIO_RECORD_STOP_FAILED = 3002,
  AUDIO_PLAY_FAILED = 3003,
  AUDIO_PERMISSION_DENIED = 3004,
  AUDIO_SIMULATOR_NOT_SUPPORTED = 3005,
  
  // 网络相关错误 (4xxx)
  NETWORK_REQUEST_FAILED = 4001,
  NETWORK_VOICE_SEND_FAILED = 4002,
  NETWORK_VOICE_RECEIVE_FAILED = 4003,
  
  // 设备相关错误 (5xxx)
  DEVICE_ID_GENERATION_FAILED = 5001,
  DEVICE_STORAGE_ACCESS_FAILED = 5002,
}

// 错误信息映射
export const ErrorMessages: Record<ErrorCode, string> = {
  // 应用初始化错误
  [ErrorCode.APP_INIT_FAILED]: '应用初始化失败',
  [ErrorCode.PLATFORM_INIT_FAILED]: '平台适配器初始化失败',
  
  // Bundle/资源加载错误
  [ErrorCode.BUNDLE_URL_NOT_AVAILABLE]: 'Bundle URL 不可用',
  [ErrorCode.BUNDLE_LOAD_FAILED]: 'Bundle 加载失败',
  [ErrorCode.MAIN_BUNDLE_NOT_FOUND]: '未找到主 Bundle 文件',
  
  // 音频相关错误
  [ErrorCode.AUDIO_RECORD_START_FAILED]: '音频录制启动失败',
  [ErrorCode.AUDIO_RECORD_STOP_FAILED]: '音频录制停止失败',
  [ErrorCode.AUDIO_PLAY_FAILED]: '音频播放失败',
  [ErrorCode.AUDIO_PERMISSION_DENIED]: '麦克风权限被拒绝',
  [ErrorCode.AUDIO_SIMULATOR_NOT_SUPPORTED]: '模拟器不支持录音功能',
  
  // 网络相关错误
  [ErrorCode.NETWORK_REQUEST_FAILED]: '网络请求失败',
  [ErrorCode.NETWORK_VOICE_SEND_FAILED]: '语音发送失败',
  [ErrorCode.NETWORK_VOICE_RECEIVE_FAILED]: '语音接收失败',
  
  // 设备相关错误
  [ErrorCode.DEVICE_ID_GENERATION_FAILED]: '设备ID生成失败',
  [ErrorCode.DEVICE_STORAGE_ACCESS_FAILED]: '设备存储访问失败',
};

// 错误解决方案提示
export const ErrorSolutions: Partial<Record<ErrorCode, string[]>> = {
  [ErrorCode.BUNDLE_URL_NOT_AVAILABLE]: [
    "运行 'npm start' 在 apps/native 目录",
    "运行 'npm run ios' (会自动启动 Metro)",
    "检查 Metro bundler 是否在端口 8081 上运行",
  ],
  [ErrorCode.AUDIO_SIMULATOR_NOT_SUPPORTED]: [
    '在真机上测试录音功能',
    '检查模拟器设置：Hardware → Microphone → 选择 "Built-in Microphone"',
  ],
  [ErrorCode.AUDIO_PERMISSION_DENIED]: [
    '前往 iOS 设置 → EchoNative → 麦克风，允许访问',
  ],
};

/**
 * 获取错误信息
 */
export function getErrorMessage(code: ErrorCode): string {
  return ErrorMessages[code] || '未知错误';
}

/**
 * 获取错误解决方案
 */
export function getErrorSolutions(code: ErrorCode): string[] {
  return ErrorSolutions[code] || [];
}

