import React from 'react';

import './LoadingPulse.css';

interface LoadingPulseProps {
  /** 是否显示 */
  visible?: boolean;
  /** 加载点颜色 */
  color?: string;
  /** 加载点数量 */
  dots?: number;
  /** 动画持续时间（秒） */
  duration?: number;
}

/**
 * 加载脉冲效果 - 适合网络请求、加载状态
 * 跨端友好：纯CSS动画，Web/RN/Taro通用
 */
export const LoadingPulse: React.FC<LoadingPulseProps> = ({
  visible = false,
  color = 'rgba(255, 255, 255, 0.8)',
  dots = 3,
  duration = 1.4,
}) => {
  if (!visible) return null;

  return (
    <div
      className="loading-pulse"
      style={{
        '--pulse-color': color,
        '--pulse-duration': `${duration}s`,
      } as React.CSSProperties}
    >
      {Array.from({ length: dots }).map((_, index) => (
        <div
          key={index}
          className="loading-dot"
          style={{
            animationDelay: `${(index * duration) / (dots * 2)}s`,
          }}
        />
      ))}
    </div>
  );
};

