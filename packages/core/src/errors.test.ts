import { describe, it, expect } from 'vitest';
import {
  ErrorCode,
  ErrorMessages,
  ErrorSolutions,
  getErrorMessage,
  getErrorSolutions,
} from './errors';

describe('errors', () => {
  describe('ErrorCode enum', () => {
    it('should have all error codes defined', () => {
      // 验证所有错误码都有对应的错误信息
      const errorCodes = Object.values(ErrorCode).filter(
        (v) => typeof v === 'number'
      ) as ErrorCode[];
      
      errorCodes.forEach((code) => {
        expect(ErrorMessages[code]).toBeDefined();
        expect(typeof ErrorMessages[code]).toBe('string');
        expect(ErrorMessages[code].length).toBeGreaterThan(0);
      });
    });
  });

  describe('getErrorMessage', () => {
    it('should return correct error message for all ErrorCode values', () => {
      // 测试应用初始化错误
      expect(getErrorMessage(ErrorCode.APP_INIT_FAILED)).toBe('应用初始化失败');
      expect(getErrorMessage(ErrorCode.PLATFORM_INIT_FAILED)).toBe('平台适配器初始化失败');
      
      // 测试 Bundle/资源加载错误
      expect(getErrorMessage(ErrorCode.BUNDLE_URL_NOT_AVAILABLE)).toBe('Bundle URL 不可用');
      expect(getErrorMessage(ErrorCode.BUNDLE_LOAD_FAILED)).toBe('Bundle 加载失败');
      expect(getErrorMessage(ErrorCode.MAIN_BUNDLE_NOT_FOUND)).toBe('未找到主 Bundle 文件');
      
      // 测试音频相关错误
      expect(getErrorMessage(ErrorCode.AUDIO_RECORD_START_FAILED)).toBe('音频录制启动失败');
      expect(getErrorMessage(ErrorCode.AUDIO_RECORD_STOP_FAILED)).toBe('音频录制停止失败');
      expect(getErrorMessage(ErrorCode.AUDIO_PLAY_FAILED)).toBe('音频播放失败');
      expect(getErrorMessage(ErrorCode.AUDIO_PERMISSION_DENIED)).toBe('麦克风权限被拒绝');
      expect(getErrorMessage(ErrorCode.AUDIO_SIMULATOR_NOT_SUPPORTED)).toBe('模拟器不支持录音功能');
      
      // 测试网络相关错误
      expect(getErrorMessage(ErrorCode.NETWORK_REQUEST_FAILED)).toBe('网络请求失败');
      expect(getErrorMessage(ErrorCode.NETWORK_VOICE_SEND_FAILED)).toBe('语音发送失败');
      expect(getErrorMessage(ErrorCode.NETWORK_VOICE_RECEIVE_FAILED)).toBe('语音接收失败');
      
      // 测试设备相关错误
      expect(getErrorMessage(ErrorCode.DEVICE_ID_GENERATION_FAILED)).toBe('设备ID生成失败');
      expect(getErrorMessage(ErrorCode.DEVICE_STORAGE_ACCESS_FAILED)).toBe('设备存储访问失败');
    });

    it('should return "未知错误" for unknown error codes', () => {
      // 使用一个不存在的错误码（类型转换绕过 TypeScript 检查）
      const unknownCode = 9999 as ErrorCode;
      expect(getErrorMessage(unknownCode)).toBe('未知错误');
    });
  });

  describe('getErrorSolutions', () => {
    it('should return correct solutions for error codes with solutions', () => {
      // 测试 BUNDLE_URL_NOT_AVAILABLE
      const bundleSolutions = getErrorSolutions(ErrorCode.BUNDLE_URL_NOT_AVAILABLE);
      expect(bundleSolutions).toEqual([
        "运行 'npm start' 在 apps/native 目录",
        "运行 'npm run ios' (会自动启动 Metro)",
        "检查 Metro bundler 是否在端口 8081 上运行",
      ]);
      
      // 测试 AUDIO_SIMULATOR_NOT_SUPPORTED
      const audioSimulatorSolutions = getErrorSolutions(ErrorCode.AUDIO_SIMULATOR_NOT_SUPPORTED);
      expect(audioSimulatorSolutions).toEqual([
        '在真机上测试录音功能',
        '检查模拟器设置：Hardware → Microphone → 选择 "Built-in Microphone"',
      ]);
      
      // 测试 AUDIO_PERMISSION_DENIED
      const audioPermissionSolutions = getErrorSolutions(ErrorCode.AUDIO_PERMISSION_DENIED);
      expect(audioPermissionSolutions).toEqual([
        '前往 iOS 设置 → EchoNative → 麦克风，允许访问',
      ]);
    });

    it('should return empty array for error codes without solutions', () => {
      // 测试没有解决方案的错误码
      expect(getErrorSolutions(ErrorCode.APP_INIT_FAILED)).toEqual([]);
      expect(getErrorSolutions(ErrorCode.PLATFORM_INIT_FAILED)).toEqual([]);
      expect(getErrorSolutions(ErrorCode.BUNDLE_LOAD_FAILED)).toEqual([]);
      expect(getErrorSolutions(ErrorCode.AUDIO_RECORD_START_FAILED)).toEqual([]);
      expect(getErrorSolutions(ErrorCode.NETWORK_REQUEST_FAILED)).toEqual([]);
      expect(getErrorSolutions(ErrorCode.DEVICE_ID_GENERATION_FAILED)).toEqual([]);
    });

    it('should return empty array for unknown error codes', () => {
      const unknownCode = 9999 as ErrorCode;
      expect(getErrorSolutions(unknownCode)).toEqual([]);
    });
  });

  describe('ErrorMessages completeness', () => {
    it('should have error message for every ErrorCode', () => {
      const errorCodes = Object.values(ErrorCode).filter(
        (v) => typeof v === 'number'
      ) as ErrorCode[];
      
      errorCodes.forEach((code) => {
        expect(ErrorMessages[code]).toBeDefined();
        expect(ErrorMessages[code]).not.toBe('');
      });
    });
  });

  describe('ErrorSolutions structure', () => {
    it('should have solutions as arrays of strings', () => {
      Object.values(ErrorSolutions).forEach((solutions) => {
        expect(Array.isArray(solutions)).toBe(true);
        solutions.forEach((solution) => {
          expect(typeof solution).toBe('string');
          expect(solution.length).toBeGreaterThan(0);
        });
      });
    });
  });
});
