import { describe, it, expect, afterEach, vi } from 'vitest';
import { loadEnvConfig } from './taro';

describe('loaders/taro', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  describe('loadEnvConfig', () => {
    it('should read from process.env', () => {
      vi.stubGlobal('process', {
        env: {
          INTERACTION_IDLE_TIMEOUT: '5000',
          INTERACTION_FADE_TRANSITION_DURATION: '2000',
          INTERACTION_TOUCH_HOLD_THRESHOLD: '50',
          INTERACTION_ECHO_DISPLAY_DURATION: '3000',
          APP_LOG_LEVEL: 'debug',
          METRO_DEFAULT_PORT: '8081',
          METRO_DEFAULT_HOST: 'localhost',
          METRO_BUNDLE_ROOT: 'index',
          METRO_BUNDLE_NAME: 'main',
          METRO_BUNDLE_EXTENSION: 'jsbundle',
        },
      });

      const result = loadEnvConfig();

      expect(result.INTERACTION_IDLE_TIMEOUT).toBe('5000');
      expect(result.INTERACTION_FADE_TRANSITION_DURATION).toBe('2000');
      expect(result.INTERACTION_TOUCH_HOLD_THRESHOLD).toBe('50');
      expect(result.INTERACTION_ECHO_DISPLAY_DURATION).toBe('3000');
      expect(result.APP_LOG_LEVEL).toBe('debug');
      expect(result.METRO_DEFAULT_PORT).toBe('8081');
      expect(result.METRO_DEFAULT_HOST).toBe('localhost');
    });

    it('should fallback to TARO_APP_ prefixed env vars', () => {
      vi.stubGlobal('process', {
        env: {
          TARO_APP_INTERACTION_IDLE_TIMEOUT: '6000',
          TARO_APP_INTERACTION_FADE_TRANSITION_DURATION: '2500',
          TARO_APP_LOG_LEVEL: 'info',
          TARO_APP_METRO_DEFAULT_PORT: '8082',
        },
      });

      const result = loadEnvConfig();

      expect(result.INTERACTION_IDLE_TIMEOUT).toBe('6000');
      expect(result.INTERACTION_FADE_TRANSITION_DURATION).toBe('2500');
      expect(result.APP_LOG_LEVEL).toBe('info');
      expect(result.METRO_DEFAULT_PORT).toBe('8082');
    });

    it('should prefer non-TARO_APP_ prefixed vars over TARO_APP_ prefixed vars', () => {
      vi.stubGlobal('process', {
        env: {
          INTERACTION_IDLE_TIMEOUT: '5000',
          TARO_APP_INTERACTION_IDLE_TIMEOUT: '6000',
        },
      });

      const result = loadEnvConfig();

      expect(result.INTERACTION_IDLE_TIMEOUT).toBe('5000');
    });

    it('should return empty object when process.env is not available', () => {
      vi.stubGlobal('process', undefined);

      const result = loadEnvConfig();

      expect(result).toEqual({});
    });

    it('should return empty object when process exists but env is not set', () => {
      vi.stubGlobal('process', {});

      const result = loadEnvConfig();

      expect(result).toEqual({});
    });

    it('should handle missing env vars gracefully', () => {
      vi.stubGlobal('process', {
        env: {},
      });

      const result = loadEnvConfig();

      expect(result).toEqual({});
    });

    it('should handle partial env vars', () => {
      vi.stubGlobal('process', {
        env: {
          INTERACTION_IDLE_TIMEOUT: '5000',
          // Other vars are missing
        },
      });

      const result = loadEnvConfig();

      expect(result.INTERACTION_IDLE_TIMEOUT).toBe('5000');
      expect(result.INTERACTION_FADE_TRANSITION_DURATION).toBeUndefined();
      expect(result.APP_LOG_LEVEL).toBeUndefined();
    });
  });
});
