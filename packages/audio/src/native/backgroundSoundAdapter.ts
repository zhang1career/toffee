/**
 * 背景音（React Native 适配）：使用 react-native-sound 循环播放环境音。
 * 资源由宿主通过 createNativeBackgroundSoundAdapter(assets) 注入（require() 返回的 asset ID）。
 * 宿主需将音频文件放在 assets 目录并运行 npx react-native-asset 等将资源复制到原生项目。
 * 停止时采用音量渐弱（fade-out），避免突兀切断。
 */
import { Platform, NativeModules } from 'react-native';
import Sound from 'react-native-sound';
import type { BackgroundSoundType } from '../backgroundSound';
import { getPrimaryBackgroundSoundType } from '../backgroundSound';
import { logger } from '@zhang1career/logger';

/** 渐弱时长（毫秒） */
const FADE_OUT_DURATION_MS = 2000;
/** 渐弱步进间隔（毫秒） */
const FADE_OUT_STEP_MS = 50;
/** 播放时的音量 */
const PLAY_VOLUME = 0.6;

export type NativeBackgroundSoundAssets = Record<
  Exclude<BackgroundSoundType, ''>,
  number
>;

export interface NativeBackgroundSoundAdapter {
  setBackgroundSound(
    types: BackgroundSoundType[],
    enabled: boolean
  ): Promise<void>;
  releaseBackgroundSound(): void;
}

function configureAudioSessionForBackgroundSound(): Promise<void> {
  if (Platform.OS !== 'ios') return Promise.resolve();
  try {
    const { AudioSessionManager } = NativeModules;
    if (AudioSessionManager?.configureAudioSessionForPlayback) {
      return AudioSessionManager.configureAudioSessionForPlayback();
    }
  } catch (_) {
    // 忽略，库会使用默认会话
  }
  return Promise.resolve();
}

/**
 * 创建 React Native 背景音适配器。
 * @param assets 背景音类型到 Metro require() 返回的 asset ID 的映射，由宿主注入
 */
export function createNativeBackgroundSoundAdapter(
  assets: NativeBackgroundSoundAssets
): NativeBackgroundSoundAdapter {
  let currentSound: Sound | null = null;
  let fadingSound: Sound | null = null;
  let fadeOutTimerId: ReturnType<typeof setInterval> | null = null;

  try {
    Sound.setCategory('Playback', true);
    logger.info('[BackgroundSound] Category set to Playback');
  } catch (e) {
    logger.error('[BackgroundSound] Failed to set category:', e);
  }

  function cancelFadeOut(): void {
    if (fadeOutTimerId !== null) {
      clearInterval(fadeOutTimerId);
      fadeOutTimerId = null;
    }
    if (fadingSound) {
      try {
        fadingSound.stop();
        fadingSound.release();
      } catch (_) {
        // 忽略
      }
      fadingSound = null;
    }
  }

  function stopCurrentSound(): void {
    cancelFadeOut();
    if (currentSound) {
      try {
        currentSound.stop();
        currentSound.release();
      } catch (_) {
        // 忽略
      }
      currentSound = null;
    }
  }

  /** 音量渐弱后停止，用于超时等场景，听觉更自然 */
  function fadeOutAndStopCurrentSound(): void {
    cancelFadeOut();
    const sound = currentSound;
    if (!sound) return;
    currentSound = null;
    fadingSound = sound;

    const steps = Math.max(1, Math.floor(FADE_OUT_DURATION_MS / FADE_OUT_STEP_MS));
    const stepVolume = PLAY_VOLUME / steps;
    let stepIndex = 0;

    fadeOutTimerId = setInterval(() => {
      stepIndex += 1;
      const nextVolume = Math.max(0, PLAY_VOLUME - stepIndex * stepVolume);
      try {
        sound.setVolume(nextVolume);
      } catch (_) {
        // 忽略
      }
      if (stepIndex >= steps || nextVolume <= 0) {
        if (fadeOutTimerId !== null) {
          clearInterval(fadeOutTimerId);
          fadeOutTimerId = null;
        }
        fadingSound = null;
        try {
          sound.stop();
          sound.release();
        } catch (_) {
          // 忽略
        }
        logger.info('[BackgroundSound] Fade-out complete');
      }
    }, FADE_OUT_STEP_MS);
  }

  async function setBackgroundSound(
    types: BackgroundSoundType[],
    enabled: boolean
  ): Promise<void> {
    logger.info('[BackgroundSound] setBackgroundSound called:', {
      types,
      enabled,
    });

    const type = getPrimaryBackgroundSoundType(types, enabled);

    if (type === null) {
      if (currentSound) {
        fadeOutAndStopCurrentSound();
      }
      logger.info('[BackgroundSound] Not playing: enabled=', enabled);
      return;
    }

    stopCurrentSound();

    const asset = assets[type];
    if (asset == null) {
      logger.warn('[BackgroundSound] Unknown or missing asset for type:', type);
      return;
    }

    logger.info('[BackgroundSound] Loading sound for type:', type);
    await configureAudioSessionForBackgroundSound();

    const soundInstance = new Sound(
      asset,
      (error: Error | null) => {
        if (error) {
          logger.error(
            '[BackgroundSound] Failed to load sound:',
            error?.message || error
          );
          currentSound = null;
          return;
        }

        const duration = soundInstance.getDuration();
        logger.info('[BackgroundSound] Sound loaded, duration:', duration);

        if (duration <= 0) {
          logger.error(
            '[BackgroundSound] Invalid duration, sound may not have loaded properly'
          );
          soundInstance.release();
          currentSound = null;
          return;
        }

        if (currentSound !== soundInstance) {
          logger.warn(
            '[BackgroundSound] Sound instance changed, releasing old one'
          );
          soundInstance.release();
          return;
        }

        soundInstance.setVolume(PLAY_VOLUME);
        soundInstance.setNumberOfLoops(-1);
        soundInstance.play((success: boolean) => {
          if (success) {
            logger.info(
              '[BackgroundSound] Playback finished (should not happen with loop -1)'
            );
          } else {
            logger.error('[BackgroundSound] Playback failed or was stopped');
          }
        });
        logger.info('[BackgroundSound] play() called successfully');
      }
    );

    currentSound = soundInstance;
  }

  function releaseBackgroundSound(): void {
    stopCurrentSound();
  }

  return {
    setBackgroundSound,
    releaseBackgroundSound,
  };
}
