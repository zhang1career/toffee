/**
 * 背景音（Web 适配）：使用 Web Audio API 生成，无缝循环，无录音文件依赖。
 * 支持海浪、白噪声、粉红噪声、雨声；可选的固定频率基调（运行时可开关、多频率可选）。
 * 供 Web 端调用。
 *
 * 海浪声可选方案：
 * 1. 程序化（当前）：粉红噪声 + 低通 + 包络 + LFO，零资源、可调参数。
 * 2. 录音循环：通过 setOceanAudioUrl(url) 设置 MP3/WAV URL，优先播放录音，失败则回退程序化。
 */

import type { BackgroundSoundType } from '../backgroundSound';
import {
  getEffectiveBackgroundSoundTypes,
  normalizeToneFrequency,
  DEFAULT_TONE_ENABLED,
  DEFAULT_TONE_FREQUENCY_HZ,
} from '../backgroundSound';

/** 循环片段时长（秒），短小以便无缝循环 */
const LOOP_LENGTH = 2;

/** 海浪专用：更长循环减少重复感（秒） */
const OCEAN_LOOP_LENGTH = 5;

/**
 * 海浪声推荐参数（程序化）
 * - 波间隔：OCEAN_WAVES_PER_LOOP 约 0.2～0.4（越小间隔越长，0.25 ≈ 每 20 秒一波在 5s 循环内）
 * - 包络舒缓：OCEAN_ENVELOPE_SOFTNESS 约 0.55～0.75（越小越柔和）
 * - 低通：OCEAN_LOWPASS 约 0.86～0.90（略低更闷、更“远”，略高更亮）
 * - LFO 频率：0.015～0.03 Hz（整体起伏速度）
 * - LFO 增益：0.05～0.10（起伏幅度）
 */
/** 海浪：每段循环内的波数（推荐 0.2～0.4，越小间隔越长） */
const OCEAN_WAVES_PER_LOOP = 0.28;
/** 海浪包络舒缓系数（推荐 0.55～0.75） */
const OCEAN_ENVELOPE_SOFTNESS = 0.65;
/** 海浪低通系数（推荐 0.86～0.90，略低更厚、更自然） */
const OCEAN_LOWPASS = 0.88;
/** 海浪 LFO 频率 Hz（推荐 0.015～0.03） */
const OCEAN_LFO_FREQ = 0.022;
/** 海浪 LFO 增益（推荐 0.05～0.10） */
const OCEAN_LFO_GAIN = 0.065;

/** 基调音量相对背景的比例 */
const TONE_GAIN_RATIO = 0.08;

let audioContext: AudioContext | null = null;
const noiseSources: AudioBufferSourceNode[] = [];
const sourceGainNodes: GainNode[] = [];
let toneOsc: OscillatorNode | null = null;
let mainGain: GainNode | null = null;
let lfoOsc: OscillatorNode | null = null;
let lfoGain: GainNode | null = null;

let toneEnabled = DEFAULT_TONE_ENABLED;
let toneFrequencyHz = DEFAULT_TONE_FREQUENCY_HZ;

/** 可选：海浪录音 URL（MP3/WAV），设置后优先播放录音，失败或未设置则回退程序化 */
let oceanAudioUrl: string | null = null;
let oceanDecodedBuffer: AudioBuffer | null = null;

/**
 * 设置海浪录音 URL，用于播放更逼真的海浪声。
 * 传入 null 则仅使用程序化合成。
 * 解码在后台进行，解码完成后下次播放海浪时会自动使用录音。
 */
export function setOceanAudioUrl(url: string | null): void {
  oceanAudioUrl = url;
  oceanDecodedBuffer = null;
  if (!url) return;
  const ctx = getContext();
  if (!ctx) return;
  fetch(url)
    .then((r) => r.arrayBuffer())
    .then((ab) => ctx.decodeAudioData(ab))
    .then((buf) => {
      oceanDecodedBuffer = buf;
    })
    .catch(() => {});
}

function getContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!audioContext) {
    audioContext = new (window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext)();
  }
  return audioContext;
}

function createWhiteNoiseBuffer(
  ctx: AudioContext,
  durationSeconds: number,
  amplitude = 0.25
): AudioBuffer {
  const length = Math.floor(ctx.sampleRate * durationSeconds);
  const buffer = ctx.createBuffer(2, length, ctx.sampleRate);
  const L = buffer.getChannelData(0);
  const R = buffer.getChannelData(1);
  for (let i = 0; i < length; i++) {
    const v = (Math.random() * 2 - 1) * amplitude;
    L[i] = v;
    R[i] = v;
  }
  return buffer;
}

/** 简易粉红噪声（多级单极点低通近似 1/f），音质更自然、低频更饱满 */
function createPinkNoiseBuffer(
  ctx: AudioContext,
  durationSeconds: number,
  amplitude = 0.28
): AudioBuffer {
  const buffer = createWhiteNoiseBuffer(ctx, durationSeconds, amplitude);
  const L = buffer.getChannelData(0);
  const R = buffer.getChannelData(1);
  const b = [0.5, 0.35, 0.2];
  let l0 = 0,
    l1 = 0,
    l2 = 0;
  let r0 = 0,
    r1 = 0,
    r2 = 0;
  const scale = 1 / 3;
  for (let i = 0; i < L.length; i++) {
    l0 = b[0] * l0 + (1 - b[0]) * L[i];
    l1 = b[1] * l1 + (1 - b[1]) * L[i];
    l2 = b[2] * l2 + (1 - b[2]) * L[i];
    L[i] = (l0 + l1 + l2) * scale;
    r0 = b[0] * r0 + (1 - b[0]) * R[i];
    r1 = b[1] * r1 + (1 - b[1]) * R[i];
    r2 = b[2] * r2 + (1 - b[2]) * R[i];
    R[i] = (r0 + r1 + r2) * scale;
  }
  return buffer;
}

function lowpassBuffer(buffer: AudioBuffer, cutoffRatio: number): void {
  const L = buffer.getChannelData(0);
  const R = buffer.getChannelData(1);
  const coef = Math.max(0, Math.min(1, 1 - cutoffRatio));
  for (let i = 1; i < L.length; i++) {
    L[i] = L[i] * (1 - coef) + L[i - 1] * coef;
    R[i] = R[i] * (1 - coef) + R[i - 1] * coef;
  }
}

/**
 * 海浪包络：舒缓曲线（softness < 1 使每波更柔和）。
 * 雨声仍用标准正弦包络。
 */
function applyWaveEnvelope(
  buffer: AudioBuffer,
  wavesPerLoop: number,
  options: { softness?: number } = {}
): void {
  const softness = options.softness ?? 1;
  const L = buffer.getChannelData(0);
  const len = L.length;
  const waveLen = len / wavesPerLoop;
  const R = buffer.numberOfChannels > 1 ? buffer.getChannelData(1) : L;
  for (let i = 0; i < len; i++) {
    const phase = (i / waveLen) * Math.PI * 2;
    const sinPhase = Math.sin(phase);
    const envelope =
      softness >= 1
        ? 0.5 + 0.5 * sinPhase
        : 0.5 +
          0.5 *
            Math.sign(sinPhase) *
            Math.pow(Math.abs(sinPhase), softness);
    L[i] *= envelope;
    R[i] *= envelope;
  }
}

function stopCurrent(): void {
  try {
    for (const src of noiseSources) {
      try {
        src.stop();
        src.disconnect();
      } catch (_) {}
    }
    noiseSources.length = 0;
    for (const g of sourceGainNodes) {
      try {
        g.disconnect();
      } catch (_) {}
    }
    sourceGainNodes.length = 0;
    if (toneOsc) {
      toneOsc.stop();
      toneOsc.disconnect();
      toneOsc = null;
    }
    if (lfoOsc) {
      lfoOsc.stop();
      lfoOsc.disconnect();
      lfoOsc = null;
    }
    if (lfoGain) {
      lfoGain.disconnect();
      lfoGain = null;
    }
    if (mainGain) {
      mainGain.disconnect();
      mainGain = null;
    }
  } catch (_) {}
}

function applyToneOptions(): void {
  try {
    if (toneOsc) {
      toneOsc.stop();
      toneOsc.disconnect();
      toneOsc = null;
    }
  } catch (_) {}
  const ctx = getContext();
  if (!ctx || !mainGain) return;
  if (!toneEnabled || toneFrequencyHz <= 0) return;
  toneOsc = ctx.createOscillator();
  toneOsc.type = 'sine';
  toneOsc.frequency.value = toneFrequencyHz;
  const toneGain = ctx.createGain();
  toneGain.gain.value = TONE_GAIN_RATIO;
  toneOsc.connect(toneGain);
  toneGain.connect(mainGain);
  toneOsc.start(0);
}

export function getToneEnabled(): boolean {
  return toneEnabled;
}

export function getToneFrequency(): number {
  return toneFrequencyHz;
}

/** 运行时设置基调：开关与频率（Hz），0 表示关 */
export function setTone(enabled: boolean, frequencyHz: number): void {
  toneEnabled = enabled;
  toneFrequencyHz = normalizeToneFrequency(frequencyHz);
  applyToneOptions();
}

function createBufferForType(
  ctx: AudioContext,
  type: Exclude<BackgroundSoundType, ''>
): AudioBuffer {
  const duration = type === 'ocean' ? OCEAN_LOOP_LENGTH : LOOP_LENGTH;
  const buffer =
    type === 'ocean'
      ? createPinkNoiseBuffer(ctx, duration)
      : createWhiteNoiseBuffer(ctx, duration);

  if (type === 'pink-noise' || type === 'rain' || type === 'ocean') {
    lowpassBuffer(
      buffer,
      type === 'ocean' ? OCEAN_LOWPASS : type === 'rain' ? 0.85 : 0.88
    );
  }
  if (type === 'ocean') {
    applyWaveEnvelope(buffer, OCEAN_WAVES_PER_LOOP, {
      softness: OCEAN_ENVELOPE_SOFTNESS,
    });
  }
  if (type === 'rain') {
    applyWaveEnvelope(buffer, 4);
  }

  return buffer;
}

/** 创建并播放背景音；types 为空或 enabled 为 false 则仅停止 */
export function setBackgroundSound(
  types: BackgroundSoundType[],
  enabled: boolean
): void {
  stopCurrent();
  const effectiveTypes = getEffectiveBackgroundSoundTypes(types, enabled);
  if (effectiveTypes.length === 0) return;

  const ctx = getContext();
  if (!ctx) return;

  mainGain = ctx.createGain();
  mainGain.gain.value = 0.35;
  mainGain.connect(ctx.destination);

  const n = effectiveTypes.length;
  const perSourceGain = 0.35 / n;

  for (const type of effectiveTypes) {
    const buffer =
      type === 'ocean' && oceanDecodedBuffer != null
        ? oceanDecodedBuffer
        : createBufferForType(ctx, type);
    const sourceGain = ctx.createGain();
    sourceGain.gain.value = perSourceGain;
    sourceGain.connect(mainGain);
    sourceGainNodes.push(sourceGain);

    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.loop = true;
    source.connect(sourceGain);
    source.start(0);
    noiseSources.push(source);
  }

  applyToneOptions();

  const hasOcean = effectiveTypes.includes('ocean');
  const hasRain = effectiveTypes.includes('rain');
  if (hasOcean || hasRain) {
    const lfoFreq = hasOcean ? OCEAN_LFO_FREQ : 0.15;
    const lfoGainVal = hasOcean ? OCEAN_LFO_GAIN : 0.08;
    lfoOsc = ctx.createOscillator();
    lfoOsc.type = 'sine';
    lfoOsc.frequency.value = lfoFreq;
    lfoGain = ctx.createGain();
    lfoGain.gain.value = lfoGainVal;
    lfoOsc.connect(lfoGain);
    lfoGain.connect(mainGain!.gain);
    lfoOsc.start(0);
  }
}

/** 恢复 AudioContext（例如用户首次交互后调用） */
export function resumeBackgroundSoundContext(): void {
  const ctx = getContext();
  if (ctx?.state === 'suspended') ctx.resume();
}
