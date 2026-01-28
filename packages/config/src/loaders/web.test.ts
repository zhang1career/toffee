import { describe, it, expect, afterEach, vi } from 'vitest';
import { loadEnvConfig } from './web';

describe('loaders/web', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  describe('loadEnvConfig', () => {
    it('should read from window.__ENV__ when available', () => {
      const mockWindowEnv = {
        INTERACTION_IDLE_TIMEOUT: '6000',
        INTERACTION_FADE_TRANSITION_DURATION: '3000',
        INTERACTION_TOUCH_HOLD_THRESHOLD: '100',
        INTERACTION_ECHO_DISPLAY_DURATION: '4000',
        APP_LOG_LEVEL: 'debug',
        METRO_DEFAULT_PORT: '8082',
        METRO_DEFAULT_HOST: '127.0.0.1',
        METRO_BUNDLE_ROOT: 'index',
        METRO_BUNDLE_NAME: 'main',
        METRO_BUNDLE_EXTENSION: 'jsbundle',
      };

      vi.stubGlobal('window', {
        __ENV__: mockWindowEnv,
      });

      const result = loadEnvConfig();

      expect(result.INTERACTION_IDLE_TIMEOUT).toBe('6000');
      expect(result.INTERACTION_FADE_TRANSITION_DURATION).toBe('3000');
      expect(result.INTERACTION_TOUCH_HOLD_THRESHOLD).toBe('100');
      expect(result.INTERACTION_ECHO_DISPLAY_DURATION).toBe('4000');
      expect(result.APP_LOG_LEVEL).toBe('debug');
      expect(result.METRO_DEFAULT_PORT).toBe('8082');
      expect(result.METRO_DEFAULT_HOST).toBe('127.0.0.1');
    });

    it('should fallback to VITE_ prefixed env vars in window.__ENV__', () => {
      const mockWindowEnv = {
        VITE_INTERACTION_IDLE_TIMEOUT: '7000',
        VITE_INTERACTION_FADE_TRANSITION_DURATION: '3500',
        VITE_APP_LOG_LEVEL: 'info',
        VITE_METRO_DEFAULT_PORT: '8083',
      };

      vi.stubGlobal('window', {
        __ENV__: mockWindowEnv,
      });

      const result = loadEnvConfig();

      expect(result.INTERACTION_IDLE_TIMEOUT).toBe('7000');
      expect(result.INTERACTION_FADE_TRANSITION_DURATION).toBe('3500');
      expect(result.APP_LOG_LEVEL).toBe('info');
      expect(result.METRO_DEFAULT_PORT).toBe('8083');
    });

    it('should prefer non-VITE_ prefixed vars over VITE_ prefixed vars', () => {
      const mockWindowEnv = {
        INTERACTION_IDLE_TIMEOUT: '6000',
        VITE_INTERACTION_IDLE_TIMEOUT: '7000',
      };

      vi.stubGlobal('window', {
        __ENV__: mockWindowEnv,
      });

      const result = loadEnvConfig();

      expect(result.INTERACTION_IDLE_TIMEOUT).toBe('6000');
    });

    it('should fallback to process.env when window.__ENV__ is not available', () => {
      vi.stubGlobal('window', undefined);
      vi.stubGlobal('process', {
        env: {
          INTERACTION_IDLE_TIMEOUT: '8000',
          INTERACTION_FADE_TRANSITION_DURATION: '4000',
          APP_LOG_LEVEL: 'warn',
          METRO_DEFAULT_PORT: '8084',
        },
      });

      const result = loadEnvConfig();

      expect(result.INTERACTION_IDLE_TIMEOUT).toBe('8000');
      expect(result.INTERACTION_FADE_TRANSITION_DURATION).toBe('4000');
      expect(result.APP_LOG_LEVEL).toBe('warn');
      expect(result.METRO_DEFAULT_PORT).toBe('8084');
    });

    it('should fallback to VITE_ prefixed env vars in process.env', () => {
      vi.stubGlobal('window', undefined);
      vi.stubGlobal('process', {
        env: {
          VITE_INTERACTION_IDLE_TIMEOUT: '9000',
          VITE_APP_LOG_LEVEL: 'error',
        },
      });

      const result = loadEnvConfig();

      expect(result.INTERACTION_IDLE_TIMEOUT).toBe('9000');
      expect(result.APP_LOG_LEVEL).toBe('error');
    });

    it('should return empty object when no env vars are available', () => {
      vi.stubGlobal('window', undefined);
      vi.stubGlobal('process', undefined);

      const result = loadEnvConfig();

      expect(result).toEqual({});
    });

    it('should return empty object when window exists but __ENV__ is not set', () => {
      vi.stubGlobal('window', {});
      vi.stubGlobal('process', undefined);

      const result = loadEnvConfig();

      expect(result).toEqual({});
    });

    it('should return empty object when process exists but env is not set', () => {
      vi.stubGlobal('window', undefined);
      vi.stubGlobal('process', {});

      const result = loadEnvConfig();

      expect(result).toEqual({});
    });
  });
});
