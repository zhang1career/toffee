import React, { useEffect, useState } from 'react';
import { MeteorConfig } from '@toffee/core';

import './MeteorAnimation.css';

interface MeteorAnimationProps {
  config: MeteorConfig;
  onComplete: () => void;
}

export const MeteorAnimation: React.FC<MeteorAnimationProps> = ({ config, onComplete }) => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      onComplete();
    }, config.duration * 1000);

    return () => clearTimeout(timer);
  }, [config.duration, onComplete]);

  if (!isVisible) return null;

  // 计算角度（用于拖尾方向）
  const dx = config.endX - config.startX;
  const dy = config.endY - config.startY;
  const angle = Math.atan2(dy, dx) * (180 / Math.PI) + 90; // +90 因为拖尾在下方

  const style: React.CSSProperties = {
    '--duration': `${config.duration}s`,
    '--start-x': `${config.startX}vw`,
    '--start-y': `${config.startY}vh`,
    '--end-x': `${config.endX}vw`,
    '--end-y': `${config.endY}vh`,
    '--angle': `${angle}deg`,
  } as React.CSSProperties;

  return (
    <div className="meteor-container" style={style}>
      <div className="meteor" />
      <div className="meteor-tail" />
    </div>
  );
};

