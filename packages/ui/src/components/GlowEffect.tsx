import React from 'react';

import './GlowEffect.css';

interface GlowEffectProps {
  /** 是否激活 */
  active?: boolean;
  /** 光晕颜色 */
  color?: string;
  /** 光晕强度 */
  intensity?: number;
  /** 动画持续时间（秒） */
  duration?: number;
  /** 子元素 */
  children: React.ReactNode;
}

/**
 * 光晕效果 - 适合重要元素的高亮提示
 * 跨端友好：纯CSS动画，Web/RN/Taro通用
 */
export const GlowEffect: React.FC<GlowEffectProps> = ({
  active = false,
  color = 'rgba(255, 255, 255, 0.6)',
  intensity = 1,
  duration = 2,
  children,
}) => {
  return (
    <div
      className={`glow-effect ${active ? 'active' : ''}`}
      style={{
        '--glow-color': color,
        '--glow-intensity': intensity,
        '--glow-duration': `${duration}s`,
      } as React.CSSProperties}
    >
      {children}
    </div>
  );
};

