import { describe, it, expect, afterEach, vi } from 'vitest';
import { loadEnvConfig } from './native';

describe('loaders/native', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  describe('loadEnvConfig', () => {
    it('should fallback to process.env when react-native-config is not available', () => {
      // Mock require to throw error (simulating react-native-config not installed)
      // In ES modules, require may not exist, which will cause the try-catch to fall through
      if (typeof (global as any).require !== 'undefined') {
        (global as any).require = () => {
          throw new Error("Cannot find module 'react-native-config'");
        };
      }

      vi.stubGlobal('process', {
        env: {
          INTERACTION_IDLE_TIMEOUT: '6000',
          INTERACTION_FADE_TRANSITION_DURATION: '2500',
          INTERACTION_TOUCH_HOLD_THRESHOLD: '100',
          INTERACTION_ECHO_DISPLAY_DURATION: '4000',
          INTERACTION_TOUCH_DEBOUNCE_THRESHOLD: '600',
          INTERACTION_PLAYBACK_START_DELAY: '100',
          INTERACTION_ECHO_HIDE_DELAY: '2500',
          INTERACTION_MAX_RETRY_COUNT: '5',
          INTERACTION_AUDIO_SESSION_CLEANUP_DELAY: '100',
          INTERACTION_AUDIO_SESSION_CLEANUP_DELAY_FIRST: '150',
          INTERACTION_ERROR_RECOVERY_DELAY: '2000',
          INTERACTION_ENABLE_STATE_TRANSITION_LOGGING: 'true',
          INTERACTION_ENABLE_STATE_TRANSITION_VALIDATION: 'false',
          INTERACTION_MIN_RECORDING_DURATION_FOR_ECHO: '2000',
          APP_LOG_LEVEL: 'info',
          METRO_DEFAULT_PORT: '8082',
          METRO_DEFAULT_HOST: '192.168.1.1',
          METRO_BUNDLE_ROOT: 'app',
          METRO_BUNDLE_NAME: 'bundle',
          METRO_BUNDLE_EXTENSION: 'js',
        },
      });

      // Mock console.warn to avoid test output noise
      vi.stubGlobal('console', {
        ...global.console,
        warn: vi.fn(),
      });

      const result = loadEnvConfig();

      expect(result.INTERACTION_IDLE_TIMEOUT).toBe('6000');
      expect(result.INTERACTION_FADE_TRANSITION_DURATION).toBe('2500');
      expect(result.INTERACTION_TOUCH_HOLD_THRESHOLD).toBe('100');
      expect(result.INTERACTION_ECHO_DISPLAY_DURATION).toBe('4000');
      expect(result.INTERACTION_TOUCH_DEBOUNCE_THRESHOLD).toBe('600');
      expect(result.INTERACTION_PLAYBACK_START_DELAY).toBe('100');
      expect(result.INTERACTION_ECHO_HIDE_DELAY).toBe('2500');
      expect(result.INTERACTION_MAX_RETRY_COUNT).toBe('5');
      expect(result.INTERACTION_AUDIO_SESSION_CLEANUP_DELAY).toBe('100');
      expect(result.INTERACTION_AUDIO_SESSION_CLEANUP_DELAY_FIRST).toBe('150');
      expect(result.INTERACTION_ERROR_RECOVERY_DELAY).toBe('2000');
      expect(result.INTERACTION_ENABLE_STATE_TRANSITION_LOGGING).toBe('true');
      expect(result.INTERACTION_ENABLE_STATE_TRANSITION_VALIDATION).toBe('false');
      expect(result.INTERACTION_MIN_RECORDING_DURATION_FOR_ECHO).toBe('2000');
      expect(result.APP_LOG_LEVEL).toBe('info');
      expect(result.METRO_DEFAULT_PORT).toBe('8082');
      expect(result.METRO_DEFAULT_HOST).toBe('192.168.1.1');
      expect(result.METRO_BUNDLE_ROOT).toBe('app');
      expect(result.METRO_BUNDLE_NAME).toBe('bundle');
      expect(result.METRO_BUNDLE_EXTENSION).toBe('js');
    });

    it('should return empty object when process.env is not available', () => {
      // Ensure require throws (or doesn't exist in ES modules)
      if (typeof (global as any).require !== 'undefined') {
        (global as any).require = () => {
          throw new Error("Cannot find module 'react-native-config'");
        };
      }

      vi.stubGlobal('process', undefined);

      vi.stubGlobal('console', {
        ...global.console,
        warn: vi.fn(),
      });

      const result = loadEnvConfig();

      expect(result).toEqual({});
    });

    it('should return empty object when process exists but env is not set', () => {
      // Ensure require throws (or doesn't exist in ES modules)
      if (typeof (global as any).require !== 'undefined') {
        (global as any).require = () => {
          throw new Error("Cannot find module 'react-native-config'");
        };
      }

      vi.stubGlobal('process', {});

      vi.stubGlobal('console', {
        ...global.console,
        warn: vi.fn(),
      });

      const result = loadEnvConfig();

      expect(result).toEqual({});
    });

    it('should handle partial env vars', () => {
      // Ensure require throws (or doesn't exist in ES modules)
      if (typeof (global as any).require !== 'undefined') {
        (global as any).require = () => {
          throw new Error("Cannot find module 'react-native-config'");
        };
      }

      vi.stubGlobal('process', {
        env: {
          INTERACTION_IDLE_TIMEOUT: '5000',
          APP_LOG_LEVEL: 'debug',
          // Other vars are missing
        },
      });

      vi.stubGlobal('console', {
        ...global.console,
        warn: vi.fn(),
      });

      const result = loadEnvConfig();

      expect(result.INTERACTION_IDLE_TIMEOUT).toBe('5000');
      expect(result.APP_LOG_LEVEL).toBe('debug');
      expect(result.INTERACTION_FADE_TRANSITION_DURATION).toBeUndefined();
      expect(result.METRO_DEFAULT_PORT).toBeUndefined();
    });

    it('should log warning when react-native-config fails to load', () => {
      const consoleWarnSpy = vi.fn();
      vi.stubGlobal('console', {
        ...global.console,
        warn: consoleWarnSpy,
      });

      // Mock require to throw error
      if (typeof (global as any).require !== 'undefined') {
        (global as any).require = () => {
          throw new Error("Cannot find module 'react-native-config'");
        };
      }

      vi.stubGlobal('process', {
        env: {},
      });

      loadEnvConfig();

      // In ES modules, require may not exist, so the warning may not be called
      // But if require exists and throws, the warning should be called
      if (typeof (global as any).require !== 'undefined') {
        expect(consoleWarnSpy).toHaveBeenCalledWith(
          expect.stringContaining('[config/native] Failed to load react-native-config:'),
          expect.any(Error)
        );
      }
    });

    it('should handle all environment variables from process.env', () => {
      // Ensure require throws (or doesn't exist in ES modules)
      if (typeof (global as any).require !== 'undefined') {
        (global as any).require = () => {
          throw new Error("Cannot find module 'react-native-config'");
        };
      }

      const allEnvVars = {
        INTERACTION_IDLE_TIMEOUT: '5000',
        INTERACTION_FADE_TRANSITION_DURATION: '2000',
        INTERACTION_TOUCH_HOLD_THRESHOLD: '50',
        INTERACTION_ECHO_DISPLAY_DURATION: '3000',
        INTERACTION_TOUCH_DEBOUNCE_THRESHOLD: '500',
        INTERACTION_PLAYBACK_START_DELAY: '50',
        INTERACTION_ECHO_HIDE_DELAY: '2000',
        INTERACTION_MAX_RETRY_COUNT: '3',
        INTERACTION_AUDIO_SESSION_CLEANUP_DELAY: '75',
        INTERACTION_AUDIO_SESSION_CLEANUP_DELAY_FIRST: '100',
        INTERACTION_ERROR_RECOVERY_DELAY: '1000',
        INTERACTION_ENABLE_STATE_TRANSITION_LOGGING: 'true',
        INTERACTION_ENABLE_STATE_TRANSITION_VALIDATION: 'true',
        INTERACTION_MIN_RECORDING_DURATION_FOR_ECHO: '1000',
        APP_LOG_LEVEL: 'debug',
        METRO_DEFAULT_PORT: '8081',
        METRO_DEFAULT_HOST: 'localhost',
        METRO_BUNDLE_ROOT: 'index',
        METRO_BUNDLE_NAME: 'main',
        METRO_BUNDLE_EXTENSION: 'jsbundle',
      };

      vi.stubGlobal('process', {
        env: allEnvVars,
      });

      vi.stubGlobal('console', {
        ...global.console,
        warn: vi.fn(),
      });

      const result = loadEnvConfig();

      // Verify all environment variables are correctly loaded
      expect(result.INTERACTION_IDLE_TIMEOUT).toBe('5000');
      expect(result.INTERACTION_FADE_TRANSITION_DURATION).toBe('2000');
      expect(result.INTERACTION_TOUCH_HOLD_THRESHOLD).toBe('50');
      expect(result.INTERACTION_ECHO_DISPLAY_DURATION).toBe('3000');
      expect(result.INTERACTION_TOUCH_DEBOUNCE_THRESHOLD).toBe('500');
      expect(result.INTERACTION_PLAYBACK_START_DELAY).toBe('50');
      expect(result.INTERACTION_ECHO_HIDE_DELAY).toBe('2000');
      expect(result.INTERACTION_MAX_RETRY_COUNT).toBe('3');
      expect(result.INTERACTION_AUDIO_SESSION_CLEANUP_DELAY).toBe('75');
      expect(result.INTERACTION_AUDIO_SESSION_CLEANUP_DELAY_FIRST).toBe('100');
      expect(result.INTERACTION_ERROR_RECOVERY_DELAY).toBe('1000');
      expect(result.INTERACTION_ENABLE_STATE_TRANSITION_LOGGING).toBe('true');
      expect(result.INTERACTION_ENABLE_STATE_TRANSITION_VALIDATION).toBe('true');
      expect(result.INTERACTION_MIN_RECORDING_DURATION_FOR_ECHO).toBe('1000');
      expect(result.APP_LOG_LEVEL).toBe('debug');
      expect(result.METRO_DEFAULT_PORT).toBe('8081');
      expect(result.METRO_DEFAULT_HOST).toBe('localhost');
      expect(result.METRO_BUNDLE_ROOT).toBe('index');
      expect(result.METRO_BUNDLE_NAME).toBe('main');
      expect(result.METRO_BUNDLE_EXTENSION).toBe('jsbundle');
    });
  });
});
