import React, { useEffect, useState, useRef } from 'react';
import './RippleEffect.css';

interface RippleEffectProps {
  /** 是否触发 */
  trigger?: boolean;
  /** 涟漪中心位置（百分比） */
  x?: number;
  y?: number;
  /** 涟漪颜色 */
  color?: string;
  /** 动画持续时间（秒） */
  duration?: number;
  /** 动画完成回调 */
  onComplete?: () => void;
}

/**
 * 涟漪效果 - 适合触摸反馈、点击效果
 * 跨端友好：纯CSS动画，Web/RN/Taro通用
 */
export const RippleEffect: React.FC<RippleEffectProps> = ({
  trigger = false,
  x = 50,
  y = 50,
  color = 'rgba(128, 128, 128, 0.8)',
  duration = 1.5,
  onComplete,
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const triggerRef = useRef(0);

  useEffect(() => {
    if (trigger) {
      // 每次 trigger 为 true 时，递增 triggerKey 并触发新动画
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
      key={`ripple-${triggerRef.current}`}
      className="ripple-effect-container"
      style={{
        '--ripple-x': `${x}%`,
        '--ripple-y': `${y}%`,
        '--ripple-color': color,
        '--ripple-duration': `${duration}s`,
      } as React.CSSProperties}
    >
      <div className="ripple-effect" />
    </div>
  );
};

