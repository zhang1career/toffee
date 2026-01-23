import React, { useState, useEffect, useRef } from 'react';
import { EffectType } from './InteractionEffectManager';
import './SideDrawer.css';

interface SideDrawerProps {
  playbackEnabled: boolean;
  onPlaybackToggle: (enabled: boolean) => void;
  debugEnabled: boolean;
  onDebugToggle: (enabled: boolean) => void;
  effectType?: EffectType;
  onEffectTypeChange?: (effectType: EffectType) => void;
}

export const SideDrawer: React.FC<SideDrawerProps> = ({
  playbackEnabled,
  onPlaybackToggle,
  debugEnabled,
  onDebugToggle,
  effectType = 'random',
  onEffectTypeChange,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [, setIsHovering] = useState(false);
  const drawerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLDivElement>(null);
  const touchStartX = useRef<number | null>(null);

  // 鼠标悬停处理
  useEffect(() => {
    const trigger = triggerRef.current;
    if (!trigger) return;

    const handleMouseEnter = () => {
      setIsHovering(true);
      setIsOpen(true);
    };

    const handleMouseLeave = (e: MouseEvent) => {
      // 如果鼠标移动到抽屉内，保持打开
      if (drawerRef.current?.contains(e.relatedTarget as Node)) {
        return;
      }
      setIsHovering(false);
      setIsOpen(false);
    };

    trigger.addEventListener('mouseenter', handleMouseEnter);
    trigger.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      trigger.removeEventListener('mouseenter', handleMouseEnter);
      trigger.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, []);

  // 抽屉鼠标事件
  useEffect(() => {
    const drawer = drawerRef.current;
    if (!drawer) return;

    const handleMouseEnter = () => {
      setIsOpen(true);
    };

    const handleMouseLeave = () => {
      setIsOpen(false);
    };

    drawer.addEventListener('mouseenter', handleMouseEnter);
    drawer.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      drawer.removeEventListener('mouseenter', handleMouseEnter);
      drawer.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, []);

  // 触摸滑动处理（从右侧左滑）
  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    touchStartX.current = touch.clientX;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    
    const touch = e.touches[0];
    const deltaX = touchStartX.current - touch.clientX;
    const screenWidth = window.innerWidth;
    
    // 从右侧边缘开始，左滑超过50px时打开
    if (touchStartX.current > screenWidth - 50 && deltaX > 50) {
      setIsOpen(true);
    }
  };

  const handleTouchEnd = () => {
    touchStartX.current = null;
  };

  return (
    <>
      {/* 触发区域（屏幕右侧边缘） */}
      <div
        ref={triggerRef}
        className="side-drawer-trigger"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      />

      {/* 抽屉 */}
      <div
        ref={drawerRef}
        className={`side-drawer ${isOpen ? 'side-drawer-open' : ''}`}
      >
        <div className="side-drawer-content">
          <div className="side-drawer-header">
            <h3 className="side-drawer-title">设置</h3>
          </div>

          <div className="side-drawer-items">
            {/* 声音回放选项 */}
            <div className="side-drawer-item">
              <div className="side-drawer-item-label">
                <span className="side-drawer-item-title">声音回放</span>
                <span className="side-drawer-item-desc">播放你录制的语音</span>
              </div>
              <label className="side-drawer-toggle">
                <input
                  type="checkbox"
                  checked={playbackEnabled}
                  onChange={(e) => onPlaybackToggle(e.target.checked)}
                />
                <span className="side-drawer-toggle-slider" />
              </label>
            </div>

            {/* 特效选择 */}
            <div className="side-drawer-item">
              <div className="side-drawer-item-label">
                <span className="side-drawer-item-title">交互特效</span>
                <span className="side-drawer-item-desc">选择录音时的视觉效果</span>
              </div>
              <select
                className="side-drawer-select"
                value={effectType}
                onChange={(e) => onEffectTypeChange?.(e.target.value as EffectType)}
              >
                <option value="random">随机</option>
                <option value="ripple">涟漪</option>
                <option value="soundwave">声波</option>
                <option value="pulsewave">脉冲波</option>
                <option value="rotatingring">旋转光环</option>
                <option value="energywave">能量波</option>
                <option value="sparkle">闪烁星点</option>
                <option value="gradientripple">渐变波纹</option>
              </select>
            </div>

            {/* 调试选项 */}
            <div className="side-drawer-item">
              <div className="side-drawer-item-label">
                <span className="side-drawer-item-title">调试</span>
                <span className="side-drawer-item-desc">显示调试信息</span>
              </div>
              <label className="side-drawer-toggle">
                <input
                  type="checkbox"
                  checked={debugEnabled}
                  onChange={(e) => onDebugToggle(e.target.checked)}
                />
                <span className="side-drawer-toggle-slider" />
              </label>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

