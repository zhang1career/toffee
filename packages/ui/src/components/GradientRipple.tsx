import React, { useEffect, useState, useRef } from 'react';

import './GradientRipple.css';

interface GradientRippleProps {
  /** 是否触发 */
  trigger?: boolean;
  /** 波纹中心位置（百分比） */
  x?: number;
  y?: number;
  /** 渐变起始颜色 */
  startColor?: string;
  /** 渐变结束颜色 */
  endColor?: string;
  /** 动画持续时间（秒） */
  duration?: number;
  /** 动画完成回调 */
  onComplete?: () => void;
}

/**
 * 渐变波纹效果 - 适合强调交互、视觉冲击
 * 跨端友好：纯CSS动画，Web/RN/Taro通用
 * 视觉特点：渐变色波纹，比单色波纹更醒目
 */
export const GradientRipple: React.FC<GradientRippleProps> = ({
  trigger = false,
  x = 50,
  y = 50,
  startColor = 'rgba(100, 200, 255, 0.8)',
  endColor = 'rgba(255, 100, 200, 0.3)',
  duration = 1.8,
  onComplete,
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const triggerRef = useRef(0);

  useEffect(() => {
    if (trigger) {
      triggerRef.current += 1;
      setIsVisible(true);
      const timer = setTimeout(() => {
        setIsVisible(false);
        onComplete?.();
      }, duration * 1000);
      return () => clearTimeout(timer);
    }
  }, [trigger, duration, onComplete]);

  if (!isVisible) return null;

  return (
    <div
      key={`gradient-ripple-${triggerRef.current}`}
      className="gradient-ripple-container"
      style={{
        '--ripple-x': `${x}%`,
        '--ripple-y': `${y}%`,
        '--ripple-start-color': startColor,
        '--ripple-end-color': endColor,
        '--ripple-duration': `${duration}s`,
      } as React.CSSProperties}
    >
      <div className="gradient-ripple" />
    </div>
  );
};

