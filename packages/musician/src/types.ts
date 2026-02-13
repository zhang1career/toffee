/**
 * 旋律/乐谱数据类型（与 Python musician.models 对应）
 */

export interface TrajectoryPoint {
  velocity: number;
  direction: number;
  intensity: number;
}

export interface Note {
  pitch: number;
  duration: number;
  velocity: number;
  start: number;
}

export interface Track {
  name: string;
  notes: Note[];
}

export interface Score {
  bpm: number;
  time_signature: [number, number];
  tracks: Track[];
}
