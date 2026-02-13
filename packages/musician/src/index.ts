/**
 * @zhang1career/musician
 * 旋律生成与播放公共层：轨迹/音级 → 乐谱，播放常量与工具。
 * 应用可传入自己的旋律表（MELODY_TABLE），或使用内置默认表。
 */

import type { TrajectoryPoint, Score } from './types';
import type { Params } from './defaults';
import type { MelodyOverrides } from './melodyTable';
import { DEFAULT_PARAMS } from './defaults';
import { trajectoryOrKeyToMotive } from './melodyTable';
import { compose } from './composer';

export type { TrajectoryPoint, Note, Track, Score } from './types';
export type { Params } from './defaults';
export { DEFAULT_PARAMS } from './defaults';

export function mergeMelodyOverrides(
  params: Params,
  overrides: MelodyOverrides
): Params {
  return {
    ...params,
    ...(overrides.time_sign_numerator != null &&
    overrides.time_sign_denominator != null
      ? ({
          TIME_SIGNATURE_NUMERATOR: overrides.time_sign_numerator,
          TIME_SIGNATURE_DENOMINATOR: overrides.time_sign_denominator,
        } as Params)
      : {}),
    ...(overrides.bpm != null
      ? ({ COMPOSE_DEFAULT_BPM: overrides.bpm } as Params)
      : {}),
  };
}

/**
 * 从运动轨迹或从音级 key（number[]）生成完整乐谱。
 * 当 trajectory 为 TrajectoryPoint[] 时先得到 key 再查表；为 number[] 时直接作为 key 查表。
 */
export function trajectoryToScore(
  trajectoryOrKey: TrajectoryPoint[] | number[],
  params: Params = {}
): Score {
  const [motive, overrides] = trajectoryOrKeyToMotive(trajectoryOrKey, params);
  return compose(motive, mergeMelodyOverrides(params, overrides));
}

/**
 * 从音级 key（如 [1]～[7]）与旋律表生成完整乐谱。
 * 等价于 trajectoryToScore(key, params)。
 */
export function keyToScore(
  key: number[],
  params: Params & {
    MELODY_TABLE?: import('./melodyTable').MelodyTable;
    MELODY_LOOKUP_FALLBACK_CALLBACK?: () => void;
  } = {}
): Score {
  return trajectoryToScore(key, params);
}

export {
  trajectoryToKey,
  lookupMelody,
  trajectoryOrKeyToMotive,
  parseMelodyTableFromJson,
  entryToMotive,
} from './melodyTable';
export type { MelodyTable, MelodyOverrides, MelodyEntry } from './melodyTable';
export type { KeyToScoreParams } from './interface';
export { compose } from './composer';

export {
  midiToFreq,
  PLAYER_A4_FREQ,
  PLAYER_A4_MIDI,
  PLAYER_MASTER_GAIN,
  TRACK_NAME_TO_ROLE,
  DEFAULT_TRACK_GAIN,
  DEFAULT_LEGATO_OVERLAP_RATIO,
  DEFAULT_LEGATO_TRACK_NAMES,
} from './playbackConstants';
export type { InstrumentRole } from './playbackConstants';

export {
  computeScoreDurationSec,
  beatsToSeconds,
} from './scoreUtils';

export {
  buildPlaybackSchedule,
} from './playbackSchedule';
export type {
  PlaybackNoteEvent,
  PlaybackTrackSchedule,
  PlaybackSchedule,
  PlaybackScheduleOptions,
} from './playbackSchedule';

export type {
  OscillatorType,
  TimbrePartial,
  TimbreFilterLowpass,
  TimbreADSR,
  TimbrePreset,
} from './timbre';
