/**
 * 播放调度：从 Score + 选项生成「何时播何音」的纯数据，不依赖 AudioContext。
 * 各端播放器根据此调度调用各自音频 API（Web / react-native-audio-api）。
 */

import type { Score } from './types';
import {
  midiToFreq,
  TRACK_NAME_TO_ROLE,
  DEFAULT_TRACK_GAIN,
  type InstrumentRole,
} from './playbackConstants';
import { computeScoreDurationSec } from './scoreUtils';

/** 单条待播音符（时间、频率、力度等，不含音色） */
export interface PlaybackNoteEvent {
  startSec: number;
  durationSec: number;
  freq: number;
  velocity: number;
  /** 滑音起始频率（仅 motive 轨可选） */
  portamentoFromFreq?: number;
}

/** 单轨调度：轨名、角色、增益、该轨所有音符事件 */
export interface PlaybackTrackSchedule {
  trackName: string;
  role: InstrumentRole;
  trackGain: number;
  notes: PlaybackNoteEvent[];
}

/** 完整播放调度：总时长、淡入淡出、各轨调度 */
export interface PlaybackSchedule {
  totalSec: number;
  fadeInSec: number;
  fadeOutSec: number;
  tracks: PlaybackTrackSchedule[];
}

export interface PlaybackScheduleOptions {
  /** 淡入时长（秒） */
  fadeInSec: number;
  /** 淡出时长（秒） */
  fadeOutSec: number;
  /** percussion 轨是否用 C2 (36) 固定音高 */
  percussionPlayback?: 'gm' | 'c2';
  /** 启用 legato 的轨名 */
  legatoTrackNames?: string[];
  /** legato 重叠比例 0..1 */
  legatoOverlapRatio?: number;
  /** 主旋律滑音时长（秒），0 表示关闭 */
  portamentoSec?: number;
  /** 轨级增益覆盖 */
  trackGainOverrides?: Partial<Record<InstrumentRole, number>>;
  /** 总增益 0..1，默认 PLAYER_MASTER_GAIN */
  masterGain?: number;
}

const DEFAULT_MASTER_GAIN = 0.8;

/**
 * 根据乐谱与选项生成播放调度（纯函数，无副作用）。
 * 播放器只需遍历 schedule.tracks[].notes，按 timbre 调用各自平台的 scheduleNote。
 */
export function buildPlaybackSchedule(
  score: Score,
  options: PlaybackScheduleOptions
): PlaybackSchedule {
  const bpm = score.bpm;
  const beatSec = 60 / bpm;
  const totalSec = computeScoreDurationSec(score);
  const fadeInSec = Math.min(options.fadeInSec, totalSec);
  const fadeOutSec = Math.min(options.fadeOutSec, totalSec);
  const useC2 = options.percussionPlayback === 'c2';
  const legatoTrackNames = options.legatoTrackNames ?? [];
  const legatoRatio = options.legatoOverlapRatio ?? 0.2;
  const portamentoSec = options.portamentoSec ?? 0;
  const trackGainOverrides = options.trackGainOverrides ?? {};
  const masterGain = options.masterGain ?? DEFAULT_MASTER_GAIN;

  const tracks: PlaybackTrackSchedule[] = [];

  for (const track of score.tracks) {
    const role = TRACK_NAME_TO_ROLE[track.name] ?? 'motive';
    const trackGain =
      (trackGainOverrides[role] ?? DEFAULT_TRACK_GAIN[role] ?? 0.15) * masterGain;
    const useLegato = legatoTrackNames.includes(track.name);
    const sortedNotes = useLegato
      ? [...track.notes].sort(
          (a, b) => a.start - b.start || a.duration - b.duration
        )
      : track.notes;

    let prevStartSec = 0;
    let prevDurationSec = 0;
    const notes: PlaybackNoteEvent[] = [];

    for (let i = 0; i < sortedNotes.length; i++) {
      const note = sortedNotes[i]!;
      const startSec =
        useLegato && i > 0
          ? Math.max(
              note.start * beatSec,
              prevStartSec + prevDurationSec * (1 - legatoRatio)
            )
          : note.start * beatSec;
      const durationSec = note.duration * beatSec;
      const pitch =
        track.name === 'percussion' && useC2 ? 36 : note.pitch;
      const freq = midiToFreq(pitch);
      const portamentoFromFreq =
        track.name === 'motive' &&
        portamentoSec > 0 &&
        i > 0
          ? midiToFreq(sortedNotes[i - 1]!.pitch)
          : undefined;

      notes.push({
        startSec,
        durationSec,
        freq,
        velocity: note.velocity,
        portamentoFromFreq,
      });
      prevStartSec = startSec;
      prevDurationSec = durationSec;
    }

    tracks.push({
      trackName: track.name,
      role,
      trackGain,
      notes,
    });
  }

  return {
    totalSec,
    fadeInSec,
    fadeOutSec,
    tracks,
  };
}
