import React from 'react';

import './PulseWave.css';

interface PulseWaveProps {
  /** 是否激活 */
  active?: boolean;
  /** 脉冲颜色 */
  color?: string;
  /** 脉冲大小（相对于容器） */
  size?: number;
  /** 脉冲数量 */
  count?: number;
  /** 动画持续时间（秒） */
  duration?: number;
}

/**
 * 脉冲波效果 - 适合录音按钮、重要提示等
 * 跨端友好：纯CSS动画，Web/RN/Taro通用
 */
export const PulseWave: React.FC<PulseWaveProps> = ({
  active = false,
  color = 'rgba(255, 255, 255, 0.6)',
  size = 1.5,
  count = 3,
  duration = 2,
}) => {
  if (!active) return null;

  return (
    <div className="pulse-wave-container">
      <style>{`
        .pulse-wave-container {
          --pulse-color: ${color};
          --pulse-size: ${size};
          --pulse-duration: ${duration}s;
        }
      `}</style>
      {Array.from({ length: count }).map((_, index) => (
        <div
          key={index}
          className="pulse-wave"
          style={{
            animationDelay: `${(index * duration) / count}s`,
          }}
        />
      ))}
    </div>
  );
};

