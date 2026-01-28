import { describe, it, expect, beforeEach, vi } from 'vitest';
import { defaultConfig } from './defaults';

// Mock loadEnvConfig before importing the module
const mockLoadEnvConfig = vi.fn();

vi.mock('./loaders', () => ({
  loadEnvConfig: () => mockLoadEnvConfig(),
}));

describe('config/index', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
  });

  describe('INTERACTION_CONFIG', () => {
    it('should use default values when env vars are not set', async () => {
      mockLoadEnvConfig.mockReturnValue({});

      const { INTERACTION_CONFIG: config } = await import('./index');

      expect(config.idleTimeout).toBe(defaultConfig.interaction.idleTimeout);
      expect(config.fadeTransitionDuration).toBe(defaultConfig.interaction.fadeTransitionDuration);
      expect(config.touchHoldThreshold).toBe(defaultConfig.interaction.touchHoldThreshold);
      expect(config.echoDisplayDuration).toBe(defaultConfig.interaction.echoDisplayDuration);
      expect(config.touchDebounceThreshold).toBe(defaultConfig.interaction.touchDebounceThreshold);
      expect(config.playbackStartDelay).toBe(defaultConfig.interaction.playbackStartDelay);
      expect(config.echoHideDelay).toBe(defaultConfig.interaction.echoHideDelay);
      expect(config.maxRetryCount).toBe(defaultConfig.interaction.maxRetryCount);
      expect(config.audioSessionCleanupDelay).toBe(defaultConfig.interaction.audioSessionCleanupDelay);
      expect(config.audioSessionCleanupDelayFirst).toBe(defaultConfig.interaction.audioSessionCleanupDelayFirst);
      expect(config.errorRecoveryDelay).toBe(defaultConfig.interaction.errorRecoveryDelay);
      expect(config.enableStateTransitionLogging).toBe(defaultConfig.interaction.enableStateTransitionLogging);
      expect(config.enableStateTransitionValidation).toBe(defaultConfig.interaction.enableStateTransitionValidation);
      expect(config.minRecordingDurationForEcho).toBe(defaultConfig.interaction.minRecordingDurationForEcho);
    });

    it('should load values from env vars when set', async () => {
      mockLoadEnvConfig.mockReturnValue({
        INTERACTION_IDLE_TIMEOUT: '6000',
        INTERACTION_FADE_TRANSITION_DURATION: '3000',
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
      });

      const { INTERACTION_CONFIG: config } = await import('./index');

      expect(config.idleTimeout).toBe(6000);
      expect(config.fadeTransitionDuration).toBe(3000);
      expect(config.touchHoldThreshold).toBe(100);
      expect(config.echoDisplayDuration).toBe(4000);
      expect(config.touchDebounceThreshold).toBe(600);
      expect(config.playbackStartDelay).toBe(100);
      expect(config.echoHideDelay).toBe(2500);
      expect(config.maxRetryCount).toBe(5);
      expect(config.audioSessionCleanupDelay).toBe(100);
      expect(config.audioSessionCleanupDelayFirst).toBe(150);
      expect(config.errorRecoveryDelay).toBe(2000);
      expect(config.enableStateTransitionLogging).toBe(true);
      expect(config.enableStateTransitionValidation).toBe(false);
      expect(config.minRecordingDurationForEcho).toBe(2000);
    });

    it('should parse integer values correctly', async () => {
      mockLoadEnvConfig.mockReturnValue({
        INTERACTION_IDLE_TIMEOUT: '12345',
      });

      const { INTERACTION_CONFIG: config } = await import('./index');

      expect(config.idleTimeout).toBe(12345);
      expect(typeof config.idleTimeout).toBe('number');
    });

    it('should handle boolean conversion correctly', async () => {
      mockLoadEnvConfig.mockReturnValue({
        INTERACTION_ENABLE_STATE_TRANSITION_LOGGING: 'true',
        INTERACTION_ENABLE_STATE_TRANSITION_VALIDATION: 'false',
      });

      const { INTERACTION_CONFIG: config } = await import('./index');

      expect(config.enableStateTransitionLogging).toBe(true);
      expect(config.enableStateTransitionValidation).toBe(false);
    });

    it('should use default for enableStateTransitionValidation when not set', async () => {
      mockLoadEnvConfig.mockReturnValue({});

      const { INTERACTION_CONFIG: config } = await import('./index');

      expect(config.enableStateTransitionValidation).toBe(defaultConfig.interaction.enableStateTransitionValidation);
    });

    it('should use default for optional fields when not set', async () => {
      mockLoadEnvConfig.mockReturnValue({
        INTERACTION_IDLE_TIMEOUT: '5000',
        // Other optional fields not set
      });

      const { INTERACTION_CONFIG: config } = await import('./index');

      expect(config.idleTimeout).toBe(5000);
      expect(config.touchDebounceThreshold).toBe(defaultConfig.interaction.touchDebounceThreshold);
      expect(config.playbackStartDelay).toBe(defaultConfig.interaction.playbackStartDelay);
    });
  });

  describe('METRO_CONFIG', () => {
    it('should use default values when env vars are not set', async () => {
      mockLoadEnvConfig.mockReturnValue({});

      const { METRO_CONFIG: config } = await import('./index');

      expect(config.defaultPort).toBe(defaultConfig.metro.defaultPort);
      expect(config.defaultHost).toBe(defaultConfig.metro.defaultHost);
      expect(config.bundleRoot).toBe(defaultConfig.metro.bundleRoot);
      expect(config.bundleName).toBe(defaultConfig.metro.bundleName);
      expect(config.bundleExtension).toBe(defaultConfig.metro.bundleExtension);
    });

    it('should load values from env vars when set', async () => {
      mockLoadEnvConfig.mockReturnValue({
        METRO_DEFAULT_PORT: '8082',
        METRO_DEFAULT_HOST: '192.168.1.1',
        METRO_BUNDLE_ROOT: 'app',
        METRO_BUNDLE_NAME: 'bundle',
        METRO_BUNDLE_EXTENSION: 'js',
      });

      const { METRO_CONFIG: config } = await import('./index');

      expect(config.defaultPort).toBe(8082);
      expect(config.defaultHost).toBe('192.168.1.1');
      expect(config.bundleRoot).toBe('app');
      expect(config.bundleName).toBe('bundle');
      expect(config.bundleExtension).toBe('js');
    });

    it('should parse port as integer', async () => {
      mockLoadEnvConfig.mockReturnValue({
        METRO_DEFAULT_PORT: '9000',
      });

      const { METRO_CONFIG: config } = await import('./index');

      expect(config.defaultPort).toBe(9000);
      expect(typeof config.defaultPort).toBe('number');
    });

    it('should use default for string fields when empty string is provided', async () => {
      mockLoadEnvConfig.mockReturnValue({
        METRO_DEFAULT_HOST: '',
        METRO_BUNDLE_ROOT: '',
      });

      const { METRO_CONFIG: config } = await import('./index');

      // Empty string is falsy, so should use default
      expect(config.defaultHost).toBe(defaultConfig.metro.defaultHost);
      expect(config.bundleRoot).toBe(defaultConfig.metro.bundleRoot);
    });
  });

  describe('getAppLogLevel', () => {
    it('should return undefined when APP_LOG_LEVEL is not set', async () => {
      mockLoadEnvConfig.mockReturnValue({});

      const { getAppLogLevel } = await import('./index');

      expect(getAppLogLevel()).toBeUndefined();
    });

    it('should return APP_LOG_LEVEL value when set', async () => {
      mockLoadEnvConfig.mockReturnValue({
        APP_LOG_LEVEL: 'debug',
      });

      const { getAppLogLevel } = await import('./index');

      expect(getAppLogLevel()).toBe('debug');
    });

    it('should return different log levels correctly', async () => {
      const levels = ['debug', 'info', 'warn', 'error'];

      for (const level of levels) {
        mockLoadEnvConfig.mockReturnValue({
          APP_LOG_LEVEL: level,
        });

        vi.resetModules();
        const { getAppLogLevel } = await import('./index');

        expect(getAppLogLevel()).toBe(level);
      }
    });
  });
});
