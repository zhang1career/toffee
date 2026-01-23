import React from 'react';

import './RotatingRing.css';

interface RotatingRingProps {
  /** 是否激活 */
  active?: boolean;
  /** 光环中心位置（百分比） */
  x?: number;
  y?: number;
  /** 光环颜色 */
  color?: string;
  /** 光环数量 */
  rings?: number;
  /** 动画持续时间（秒） */
  duration?: number;
}

/**
 * 旋转光环效果 - 适合动态交互反馈
 * 跨端友好：纯CSS动画，Web/RN/Taro通用
 * 视觉特点：旋转的光环，与扩散效果形成明显对比
 */
export const RotatingRing: React.FC<RotatingRingProps> = ({
  active = false,
  x = 50,
  y = 50,
  color = 'rgba(255, 255, 255, 0.6)',
  rings = 3,
  duration = 2,
}) => {
  if (!active) return null;

  return (
    <div
      className="rotating-ring-container"
      style={{
        '--ring-x': `${x}%`,
        '--ring-y': `${y}%`,
        '--ring-color': color,
        '--ring-duration': `${duration}s`,
      } as React.CSSProperties}
    >
      {Array.from({ length: rings }).map((_, index) => (
        <div
          key={index}
          className="rotating-ring"
          style={{
            animationDelay: `${(index * duration) / rings}s`,
            animationDuration: `${duration}s`,
          }}
        />
      ))}
    </div>
  );
};

