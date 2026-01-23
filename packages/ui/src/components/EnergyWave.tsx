import React from 'react';

import './EnergyWave.css';

interface EnergyWaveProps {
  /** 是否激活 */
  active?: boolean;
  /** 能量波中心位置（百分比） */
  x?: number;
  y?: number;
  /** 能量波颜色 */
  color?: string;
  /** 能量波数量 */
  waves?: number;
  /** 动画持续时间（秒） */
  duration?: number;
}

/**
 * 能量波效果 - 适合能量传递、信号传输的视觉反馈
 * 跨端友好：纯CSS动画，Web/RN/Taro通用
 * 视觉特点：带状能量波，与圆形扩散形成明显对比
 */
export const EnergyWave: React.FC<EnergyWaveProps> = ({
  active = false,
  x = 50,
  y = 50,
  color = 'rgba(100, 200, 255, 0.7)',
  waves = 4,
  duration = 1.8,
}) => {
  if (!active) return null;

  return (
    <div
      className="energy-wave-container"
      style={{
        '--wave-x': `${x}%`,
        '--wave-y': `${y}%`,
        '--wave-color': color,
        '--wave-duration': `${duration}s`,
      } as React.CSSProperties}
    >
      {Array.from({ length: waves }).map((_, index) => (
        <div
          key={index}
          className="energy-wave"
          style={{
            animationDelay: `${(index * duration) / waves}s`,
            animationDuration: `${duration}s`,
          }}
        />
      ))}
    </div>
  );
};

