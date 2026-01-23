import React, { useEffect, useState } from 'react';

import './ParticleBurst.css';

interface ParticleBurstProps {
  /** 是否触发 */
  trigger?: boolean;
  /** 粒子中心位置（百分比） */
  x?: number;
  y?: number;
  /** 粒子颜色 */
  color?: string;
  /** 粒子数量 */
  count?: number;
  /** 动画持续时间（秒） */
  duration?: number;
  /** 动画完成回调 */
  onComplete?: () => void;
}

/**
 * 粒子飞散效果 - 适合发送成功、操作完成的庆祝效果
 * 跨端友好：纯CSS动画，Web/RN/Taro通用（Taro可能需要减少粒子数量）
 */
export const ParticleBurst: React.FC<ParticleBurstProps> = ({
  trigger = false,
  x = 50,
  y = 50,
  color = 'rgba(255, 255, 255, 0.8)',
  count = 12,
  duration = 1.2,
  onComplete,
}) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (trigger) {
      setIsVisible(true);
      const timer = setTimeout(() => {
        setIsVisible(false);
        onComplete?.();
      }, duration * 1000);
      return () => clearTimeout(timer);
    }
  }, [trigger, duration, onComplete]);

  if (!isVisible) return null;

  // 生成粒子角度（均匀分布）
  const particles = Array.from({ length: count }).map((_, index) => {
    const angle = (index * 360) / count;
    return angle;
  });

  return (
    <div
      className="particle-burst-container"
      style={{
        '--burst-x': `${x}%`,
        '--burst-y': `${y}%`,
        '--burst-color': color,
        '--burst-duration': `${duration}s`,
      } as React.CSSProperties}
    >
      {particles.map((angle, index) => (
        <div
          key={index}
          className="particle"
          style={{
            '--particle-angle': `${angle}deg`,
            animationDelay: `${index * 0.02}s`,
          } as React.CSSProperties}
        />
      ))}
    </div>
  );
};

