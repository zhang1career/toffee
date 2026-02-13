/**
 * 播放层公共常量：MIDI→频率、轨角色、默认轨增益等（与 Python musician/player.py 一致）
 */

export const PLAYER_A4_FREQ = 440.0;
export const PLAYER_A4_MIDI = 69;
export const PLAYER_SEMITONE_RATIO = 12;
export const PLAYER_MASTER_GAIN = 0.8;

/** 轨名 → 乐器角色（用于轨级增益） */
export type InstrumentRole =
  | 'motive'
  | 'accompaniment'
  | 'counterpoint'
  | 'pad'
  | 'bass'
  | 'percussion'
  | 'ornamentation';

export const TRACK_NAME_TO_ROLE: Record<string, InstrumentRole> = {
  motive: 'motive',
  accompaniment: 'accompaniment',
  counterpoint: 'counterpoint',
  pad: 'pad',
  bass: 'bass',
  percussion: 'percussion',
  ornamentation: 'ornamentation',
};

export const DEFAULT_TRACK_GAIN: Record<InstrumentRole, number> = {
  motive: 1.0,
  accompaniment: 1.0,
  counterpoint: 1.0,
  pad: 1.0,
  bass: 1.0,
  percussion: 1.0,
  ornamentation: 1.0,
};

/** MIDI 音高 → 频率（Hz），与 Python midi_to_freq 一致 */
export function midiToFreq(midi: number): number {
  return PLAYER_A4_FREQ * Math.pow(2, (midi - PLAYER_A4_MIDI) / PLAYER_SEMITONE_RATIO);
}

export const DEFAULT_LEGATO_OVERLAP_RATIO = 0.2;
export const DEFAULT_LEGATO_TRACK_NAMES: string[] = [
  'motive',
  'pad',
  'counterpoint',
];
