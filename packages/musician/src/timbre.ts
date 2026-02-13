/**
 * 配器类型：单音由若干分音（基波+泛音）+ ADSR 包络描述。
 * 与 Python musician 及各端 orchestration 一致，播放调度只依赖此抽象。
 */

export type OscillatorType = 'sine' | 'square' | 'sawtooth' | 'triangle';

/** 一个分音：波形类型、相对基频的倍数、相对增益（与其它分音一起归一化） */
export interface TimbrePartial {
  type: OscillatorType;
  freqRatio: number;
  gainRatio: number;
  detuneCents?: number;
}

export interface TimbreFilterLowpass {
  type: 'lowpass';
  freq: number;
  Q: number;
}

export interface TimbreADSR {
  attackSec: number;
  decaySec: number;
  sustainLevel: number;
  releaseSec: number;
  adsrCurve?: 'linear' | 'exponential';
}

export interface TimbrePreset {
  partials: TimbrePartial[];
  adsr: TimbreADSR;
  filter?: TimbreFilterLowpass;
  pan?: number;
}
