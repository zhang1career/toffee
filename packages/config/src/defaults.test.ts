import { describe, it, expect } from 'vitest';
import {
  defaultInteractionConfig,
  defaultMetroConfig,
  defaultConfig,
} from './defaults';
import type { InteractionConfig, MetroConfig } from './types';

describe('defaults', () => {
  describe('defaultInteractionConfig', () => {
    it('should have all required fields', () => {
      expect(defaultInteractionConfig).toBeDefined();
      expect(defaultInteractionConfig.idleTimeout).toBeDefined();
      expect(defaultInteractionConfig.fadeTransitionDuration).toBeDefined();
      expect(defaultInteractionConfig.touchHoldThreshold).toBeDefined();
      expect(defaultInteractionConfig.echoDisplayDuration).toBeDefined();
    });

    it('should have correct types for all fields', () => {
      expect(typeof defaultInteractionConfig.idleTimeout).toBe('number');
      expect(typeof defaultInteractionConfig.fadeTransitionDuration).toBe('number');
      expect(typeof defaultInteractionConfig.touchHoldThreshold).toBe('number');
      expect(typeof defaultInteractionConfig.echoDisplayDuration).toBe('number');
      expect(typeof defaultInteractionConfig.touchDebounceThreshold).toBe('number');
      expect(typeof defaultInteractionConfig.playbackStartDelay).toBe('number');
      expect(typeof defaultInteractionConfig.echoHideDelay).toBe('number');
      expect(typeof defaultInteractionConfig.maxRetryCount).toBe('number');
      expect(typeof defaultInteractionConfig.audioSessionCleanupDelay).toBe('number');
      expect(typeof defaultInteractionConfig.audioSessionCleanupDelayFirst).toBe('number');
      expect(typeof defaultInteractionConfig.errorRecoveryDelay).toBe('number');
      expect(typeof defaultInteractionConfig.enableStateTransitionLogging).toBe('boolean');
      expect(typeof defaultInteractionConfig.enableStateTransitionValidation).toBe('boolean');
      expect(typeof defaultInteractionConfig.minRecordingDurationForEcho).toBe('number');
    });

    it('should have reasonable default values', () => {
      expect(defaultInteractionConfig.idleTimeout).toBeGreaterThan(0);
      expect(defaultInteractionConfig.fadeTransitionDuration).toBeGreaterThan(0);
      expect(defaultInteractionConfig.touchHoldThreshold).toBeGreaterThan(0);
      expect(defaultInteractionConfig.echoDisplayDuration).toBeGreaterThan(0);
      expect(defaultInteractionConfig.touchDebounceThreshold).toBeGreaterThan(0);
      expect(defaultInteractionConfig.playbackStartDelay).toBeGreaterThanOrEqual(0);
      expect(defaultInteractionConfig.echoHideDelay).toBeGreaterThan(0);
      expect(defaultInteractionConfig.maxRetryCount).toBeGreaterThan(0);
      expect(defaultInteractionConfig.audioSessionCleanupDelay).toBeGreaterThan(0);
      expect(defaultInteractionConfig.audioSessionCleanupDelayFirst).toBeGreaterThan(0);
      expect(defaultInteractionConfig.errorRecoveryDelay).toBeGreaterThan(0);
      expect(defaultInteractionConfig.minRecordingDurationForEcho).toBeGreaterThan(0);
    });

    it('should match InteractionConfig interface', () => {
      const config: InteractionConfig = defaultInteractionConfig;
      expect(config).toBeDefined();
    });
  });

  describe('defaultMetroConfig', () => {
    it('should have all required fields', () => {
      expect(defaultMetroConfig).toBeDefined();
      expect(defaultMetroConfig.defaultPort).toBeDefined();
      expect(defaultMetroConfig.defaultHost).toBeDefined();
      expect(defaultMetroConfig.bundleRoot).toBeDefined();
      expect(defaultMetroConfig.bundleName).toBeDefined();
      expect(defaultMetroConfig.bundleExtension).toBeDefined();
    });

    it('should have correct types for all fields', () => {
      expect(typeof defaultMetroConfig.defaultPort).toBe('number');
      expect(typeof defaultMetroConfig.defaultHost).toBe('string');
      expect(typeof defaultMetroConfig.bundleRoot).toBe('string');
      expect(typeof defaultMetroConfig.bundleName).toBe('string');
      expect(typeof defaultMetroConfig.bundleExtension).toBe('string');
    });

    it('should have reasonable default values', () => {
      expect(defaultMetroConfig.defaultPort).toBeGreaterThan(0);
      expect(defaultMetroConfig.defaultPort).toBeLessThan(65536);
      expect(defaultMetroConfig.defaultHost).toBeTruthy();
      expect(defaultMetroConfig.bundleRoot).toBeTruthy();
      expect(defaultMetroConfig.bundleName).toBeTruthy();
      expect(defaultMetroConfig.bundleExtension).toBeTruthy();
    });

    it('should match MetroConfig interface', () => {
      const config: MetroConfig = defaultMetroConfig;
      expect(config).toBeDefined();
    });
  });

  describe('defaultConfig', () => {
    it('should contain both interaction and metro configs', () => {
      expect(defaultConfig).toBeDefined();
      expect(defaultConfig.interaction).toBeDefined();
      expect(defaultConfig.metro).toBeDefined();
    });

    it('should reference the same objects as individual exports', () => {
      expect(defaultConfig.interaction).toBe(defaultInteractionConfig);
      expect(defaultConfig.metro).toBe(defaultMetroConfig);
    });
  });
});
