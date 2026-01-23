import React from 'react';

import './SparkleEffect.css';

interface SparkleEffectProps {
  /** 是否激活 */
  active?: boolean;
  /** 星点中心位置（百分比） */
  x?: number;
  y?: number;
  /** 星点颜色 */
  color?: string;
  /** 星点数量 */
  count?: number;
  /** 动画持续时间（秒） */
  duration?: number;
}

/**
 * 闪烁星点效果 - 适合魔法感、惊喜感的视觉反馈
 * 跨端友好：纯CSS动画，Web/RN/Taro通用
 * 视觉特点：闪烁的星点，与扩散效果形成明显对比
 */
export const SparkleEffect: React.FC<SparkleEffectProps> = ({
  active = false,
  x = 50,
  y = 50,
  color = 'rgba(255, 255, 255, 0.9)',
  count = 8,
  duration = 1.5,
}) => {
  if (!active) return null;

  // 生成星点位置（围绕中心点分布）
  const sparkles = Array.from({ length: count }).map((_, index) => {
    const angle = (index * 360) / count;
    const radius = 60 + Math.random() * 40; // 随机半径
    return {
      angle,
      radius,
      delay: index * 0.1,
    };
  });

  return (
    <div
      className="sparkle-effect-container"
      style={{
        '--sparkle-x': `${x}%`,
        '--sparkle-y': `${y}%`,
        '--sparkle-color': color,
        '--sparkle-duration': `${duration}s`,
      } as React.CSSProperties}
    >
      {sparkles.map((sparkle, index) => (
        <div
          key={index}
          className="sparkle"
          style={{
            '--sparkle-angle': `${sparkle.angle}deg`,
            '--sparkle-radius': `${sparkle.radius}px`,
            animationDelay: `${sparkle.delay}s`,
            animationDuration: `${duration}s`,
          } as React.CSSProperties}
        />
      ))}
    </div>
  );
};

