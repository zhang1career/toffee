/**
 * Musician 对外类型（供 touch-melody 等配置使用）
 */

import type { MelodyTable, MelodyOverrides, MelodyEntry } from './melodyTable';
import type { Params } from './defaults';
import type { Score, Note } from './types';

export type { MelodyTable, MelodyOverrides, MelodyEntry, Params, Score, Note };

export type KeyToScoreParams = Params & {
  MELODY_TABLE?: MelodyTable;
  MELODY_LOOKUP_FALLBACK_CALLBACK?: () => void;
};
