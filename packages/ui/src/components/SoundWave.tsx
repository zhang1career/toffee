import React from 'react';

import './SoundWave.css';

interface SoundWaveProps {
  /** 是否激活 */
  active?: boolean;
  /** 声波中心位置（百分比） */
  x?: number;
  y?: number;
  /** 声波颜色 */
  color?: string;
  /** 声波圈数 */
  rings?: number;
  /** 动画持续时间（秒） */
  duration?: number;
}

/**
 * 声波扩散效果 - 适合录音时的视觉反馈
 * 跨端友好：纯CSS动画，Web/RN/Taro通用
 */
export const SoundWave: React.FC<SoundWaveProps> = ({
  active = false,
  x = 50,
  y = 50,
  color = 'rgba(255, 255, 255, 0.4)',
  rings = 4,
  duration = 1.5,
}) => {
  if (!active) return null;

  return (
    <div
      className="sound-wave-container"
      style={{
        '--wave-x': `${x}%`,
        '--wave-y': `${y}%`,
        '--wave-color': color,
        '--wave-duration': `${duration}s`,
      } as React.CSSProperties}
    >
      {Array.from({ length: rings }).map((_, index) => (
        <div
          key={index}
          className="sound-wave-ring"
          style={{
            animationDelay: `${(index * duration) / rings}s`,
          }}
        />
      ))}
    </div>
  );
};

