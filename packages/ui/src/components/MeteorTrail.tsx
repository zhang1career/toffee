import React, { useEffect, useState } from 'react';
import { MeteorConfig } from '@zhang1career/core';
import './MeteorTrail.css';

interface MeteorTrailProps {
  config: MeteorConfig;
  onComplete: () => void;
}

export const MeteorTrail: React.FC<MeteorTrailProps> = ({ config, onComplete }) => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(onComplete, 300); // 等待淡出动画完成
    }, config.duration * 1000);

    return () => clearTimeout(timer);
  }, [config.duration, onComplete]);

  if (!isVisible) return null;

  // 计算相对位移（百分比差值）
  const deltaXPercent = config.endX - config.startX;
  const deltaYPercent = config.endY - config.startY;

  return (
    <>
      <div
        className="meteor-trail"
        style={{
          position: 'fixed',
          left: `${config.startX}%`,
          top: `${config.startY}%`,
          width: '4px',
          height: '4px',
          zIndex: 20,
          pointerEvents: 'none',
          ['--delta-x' as string]: `${deltaXPercent}vw`,
          ['--delta-y' as string]: `${deltaYPercent}vh`,
          ['--duration' as string]: `${config.duration}s`,
        } as React.CSSProperties}
      >
        <div 
          className="meteor-core"
          style={{
            position: 'absolute',
            width: '4px',
            height: '4px',
            background: 'rgba(255, 255, 255, 0.9)',
            borderRadius: '50%',
            boxShadow: '0 0 8px rgba(255, 255, 255, 0.8), 0 0 16px rgba(255, 255, 255, 0.4)',
          }}
        />
        <div 
          className="meteor-tail"
          style={{
            position: 'absolute',
            width: '2px',
            height: '60px',
            background: 'linear-gradient(to bottom, rgba(255, 255, 255, 0.9) 0%, rgba(255, 255, 255, 0.5) 30%, rgba(255, 255, 255, 0.2) 60%, transparent 100%)',
            transform: 'translate(-50%, -100%) rotate(45deg)',
            transformOrigin: 'bottom center',
            filter: 'blur(1px)',
          }}
        />
      </div>
      <style>{`
        @keyframes meteorMove {
          0% {
            opacity: 1;
            transform: translate(-50%, -50%);
          }
          100% {
            opacity: 0;
            transform: translate(calc(-50% + var(--delta-x)), calc(-50% + var(--delta-y)));
          }
        }
        .meteor-trail {
          animation: meteorMove var(--duration) ease-out forwards;
        }
      `}</style>
    </>
  );
};

