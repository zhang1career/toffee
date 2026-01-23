import React, { useRef, useEffect } from 'react';
import './HoldButton.css';

interface HoldButtonProps {
  onStart: () => void;
  onEnd: () => void;
  isRecording?: boolean;
}

export const HoldButton: React.FC<HoldButtonProps> = ({ onStart, onEnd, isRecording = false }) => {
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const button = buttonRef.current;
    if (!button) return;

    const handleStart = (e: Event) => {
      e.preventDefault();
      onStart();
    };

    const handleEnd = (e: Event) => {
      e.preventDefault();
      onEnd();
    };

    // 支持触摸和鼠标事件
    button.addEventListener('touchstart', handleStart, { passive: false });
    button.addEventListener('touchend', handleEnd, { passive: false });
    button.addEventListener('touchcancel', handleEnd, { passive: false });
    button.addEventListener('mousedown', handleStart);
    button.addEventListener('mouseup', handleEnd);
    button.addEventListener('mouseleave', handleEnd);

    return () => {
      button.removeEventListener('touchstart', handleStart);
      button.removeEventListener('touchend', handleEnd);
      button.removeEventListener('touchcancel', handleEnd);
      button.removeEventListener('mousedown', handleStart);
      button.removeEventListener('mouseup', handleEnd);
      button.removeEventListener('mouseleave', handleEnd);
    };
  }, [onStart, onEnd]);

  return (
    <button
      ref={buttonRef}
      className={`hold-button ${isRecording ? 'recording' : ''}`}
      type="button"
      aria-label="按住说话"
    >
      <span className="hold-button-inner" />
    </button>
  );
};

