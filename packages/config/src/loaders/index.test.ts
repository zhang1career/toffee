import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { loadEnvConfig } from './index';
import * as webLoader from './web';
import * as nativeLoader from './native';
import * as taroLoader from './taro';

describe('loaders/index', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  describe('loadEnvConfig', () => {
    it('should use native loader when React Native environment is detected', () => {
      vi.stubGlobal('navigator', {
        product: 'ReactNative',
      });
      vi.stubGlobal('window', undefined);
      vi.stubGlobal('process', undefined);

      const nativeSpy = vi.spyOn(nativeLoader, 'loadEnvConfig').mockReturnValue({
        INTERACTION_IDLE_TIMEOUT: '5000',
      });

      const result = loadEnvConfig();

      expect(nativeSpy).toHaveBeenCalled();
      expect(result.INTERACTION_IDLE_TIMEOUT).toBe('5000');
    });

    it('should use taro loader when Taro environment is detected', () => {
      vi.stubGlobal('navigator', undefined);
      vi.stubGlobal('process', {
        env: {
          TARO_ENV: 'weapp',
        },
      });
      vi.stubGlobal('window', undefined);

      const taroSpy = vi.spyOn(taroLoader, 'loadEnvConfig').mockReturnValue({
        INTERACTION_IDLE_TIMEOUT: '6000',
      });

      const result = loadEnvConfig();

      expect(taroSpy).toHaveBeenCalled();
      expect(result.INTERACTION_IDLE_TIMEOUT).toBe('6000');
    });

    it('should use web loader when window is available', () => {
      vi.stubGlobal('navigator', undefined);
      vi.stubGlobal('process', {
        env: {},
      });
      vi.stubGlobal('window', {});

      const webSpy = vi.spyOn(webLoader, 'loadEnvConfig').mockReturnValue({
        INTERACTION_IDLE_TIMEOUT: '7000',
      });

      const result = loadEnvConfig();

      expect(webSpy).toHaveBeenCalled();
      expect(result.INTERACTION_IDLE_TIMEOUT).toBe('7000');
    });

    it('should default to web loader when no specific environment is detected', () => {
      vi.stubGlobal('navigator', undefined);
      vi.stubGlobal('process', undefined);
      vi.stubGlobal('window', undefined);

      const webSpy = vi.spyOn(webLoader, 'loadEnvConfig').mockReturnValue({
        INTERACTION_IDLE_TIMEOUT: '8000',
      });

      const result = loadEnvConfig();

      expect(webSpy).toHaveBeenCalled();
      expect(result.INTERACTION_IDLE_TIMEOUT).toBe('8000');
    });

    it('should prioritize React Native over Taro', () => {
      vi.stubGlobal('navigator', {
        product: 'ReactNative',
      });
      vi.stubGlobal('process', {
        env: {
          TARO_ENV: 'weapp',
        },
      });
      vi.stubGlobal('window', {});

      const nativeSpy = vi.spyOn(nativeLoader, 'loadEnvConfig').mockReturnValue({
        INTERACTION_IDLE_TIMEOUT: '5000',
      });
      const taroSpy = vi.spyOn(taroLoader, 'loadEnvConfig');
      const webSpy = vi.spyOn(webLoader, 'loadEnvConfig');

      const result = loadEnvConfig();

      expect(nativeSpy).toHaveBeenCalled();
      expect(taroSpy).not.toHaveBeenCalled();
      expect(webSpy).not.toHaveBeenCalled();
      expect(result.INTERACTION_IDLE_TIMEOUT).toBe('5000');
    });

    it('should prioritize Taro over Web when both are available', () => {
      vi.stubGlobal('navigator', undefined);
      vi.stubGlobal('process', {
        env: {
          TARO_ENV: 'h5',
        },
      });
      vi.stubGlobal('window', {});

      const taroSpy = vi.spyOn(taroLoader, 'loadEnvConfig').mockReturnValue({
        INTERACTION_IDLE_TIMEOUT: '6000',
      });
      const webSpy = vi.spyOn(webLoader, 'loadEnvConfig');

      const result = loadEnvConfig();

      expect(taroSpy).toHaveBeenCalled();
      expect(webSpy).not.toHaveBeenCalled();
      expect(result.INTERACTION_IDLE_TIMEOUT).toBe('6000');
    });

    it('should handle React Native detection correctly', () => {
      vi.stubGlobal('navigator', {
        product: 'ReactNative',
      });

      const nativeSpy = vi.spyOn(nativeLoader, 'loadEnvConfig').mockReturnValue({});

      loadEnvConfig();

      expect(nativeSpy).toHaveBeenCalled();
    });

    it('should handle Taro detection correctly', () => {
      vi.stubGlobal('process', {
        env: {
          TARO_ENV: 'swan',
        },
      });

      const taroSpy = vi.spyOn(taroLoader, 'loadEnvConfig').mockReturnValue({});

      loadEnvConfig();

      expect(taroSpy).toHaveBeenCalled();
    });
  });
});
