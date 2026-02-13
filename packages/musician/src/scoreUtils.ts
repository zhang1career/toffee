/**
 * 乐谱工具：时长计算等（与 Python score.total_duration() 一致）
 */

import type { Score } from './types';

/** 乐谱总时长（秒） */
export function computeScoreDurationSec(score: Score): number {
  const beatSec = 60 / score.bpm;
  let maxEndBeats = 0;
  for (const track of score.tracks) {
    for (const note of track.notes) {
      const end = note.start + note.duration;
      if (end > maxEndBeats) maxEndBeats = end;
    }
  }
  return maxEndBeats * beatSec;
}

/** 拍数 → 秒（给定 BPM） */
export function beatsToSeconds(beats: number, bpm: number): number {
  return (beats * 60) / bpm;
}
