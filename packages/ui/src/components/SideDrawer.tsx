import React, { useState, useEffect, useRef } from 'react';
import type { FC, ReactNode } from 'react';
import { EffectType } from './InteractionEffectManager';
import './SideDrawer.css';

// --- 子组件（可单独使用）---

export interface SideDrawerHeaderProps {
  title?: string;
  children?: ReactNode;
}

export const SideDrawerHeader: FC<SideDrawerHeaderProps> = ({
  title = '设置',
  children,
}) => (
  <div className="side-drawer-header">
    {children ?? <h3 className="side-drawer-title">{title}</h3>}
  </div>
);

export interface SideDrawerItemProps {
  title: string;
  description?: string;
  children: ReactNode;
}

export const SideDrawerItem: FC<SideDrawerItemProps> = ({
  title,
  description,
  children,
}) => (
  <div className="side-drawer-item">
    <div className="side-drawer-item-label">
      <span className="side-drawer-item-title">{title}</span>
      {description && (
        <span className="side-drawer-item-desc">{description}</span>
      )}
    </div>
    {children}
  </div>
);

export interface SideDrawerToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
}

export const SideDrawerToggle: FC<SideDrawerToggleProps> = ({
  checked,
  onChange,
}) => (
  <label className="side-drawer-toggle">
    <input
      type="checkbox"
      checked={checked}
      onChange={(e) => onChange(e.target.checked)}
    />
    <span className="side-drawer-toggle-slider" />
  </label>
);

// --- 主组件 ---

/** 定频基调可选频率（Hz），0 表示关 */
export interface ToneFrequencyOption {
  value: number;
  label: string;
}

/** 背景音类型选项 */
export interface BackgroundSoundOption {
  value: string;
  label: string;
}

/** 背景音变更载荷 */
export interface BackgroundSoundChangePayload {
  playing?: boolean;
  type?: string;
  toneEnabled?: boolean;
  toneFrequency?: number;
}

export interface SideDrawerProps {
  /** 自定义内容。传入时仅渲染壳 + children，忽略下方默认配置 */
  children?: ReactNode;
  playbackEnabled?: boolean;
  onPlaybackToggle?: (enabled: boolean) => void;
  debugEnabled?: boolean;
  onDebugToggle?: (enabled: boolean) => void;
  effectType?: EffectType;
  onEffectTypeChange?: (effectType: EffectType) => void;
  /** 背景音功能总开关：为 true 时显示「背景音」区块，为 false/undefined 时不显示 */
  backgroundSoundEnabled?: boolean;
  /** 背景音是否正在播放 */
  backgroundSoundPlaying?: boolean;
  /** 背景音类型（单选） */
  backgroundSoundType?: string;
  /** 固定频率基调是否开启 */
  toneEnabled?: boolean;
  /** 固定频率基调频率（Hz），0 为关 */
  toneFrequency?: number;
  /** 背景音类型选项列表 */
  backgroundSoundOptions?: BackgroundSoundOption[];
  /** 基调频率选项列表 */
  toneFrequencyOptions?: ToneFrequencyOption[];
  /** 背景音变更回调（播放、类型、基调开关、基调频率） */
  onBackgroundSoundChange?: (payload: BackgroundSoundChangePayload) => void;
}

const SideDrawerBase: FC<SideDrawerProps> = ({
  children,
  playbackEnabled = false,
  onPlaybackToggle,
  debugEnabled = false,
  onDebugToggle,
  effectType = 'random',
  onEffectTypeChange,
  backgroundSoundEnabled = false,
  backgroundSoundPlaying = false,
  backgroundSoundType = '',
  toneEnabled = false,
  toneFrequency = 0,
  backgroundSoundOptions = [],
  toneFrequencyOptions = [],
  onBackgroundSoundChange,
}) => {
  const showPlayback =
    playbackEnabled !== undefined && onPlaybackToggle !== undefined;
  const showEffect = onEffectTypeChange !== undefined;
  const showBackgroundSound =
    backgroundSoundEnabled === true && onBackgroundSoundChange !== undefined;
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

  useEffect(() => {
    const drawer = drawerRef.current;
    if (!drawer) return;

    const handleMouseEnter = () => setIsOpen(true);
    const handleMouseLeave = () => setIsOpen(false);

    drawer.addEventListener('mouseenter', handleMouseEnter);
    drawer.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      drawer.removeEventListener('mouseenter', handleMouseEnter);
      drawer.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, []);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const touch = e.touches[0];
    const deltaX = touchStartX.current - touch.clientX;
    const screenWidth = window.innerWidth;
    if (touchStartX.current > screenWidth - 50 && deltaX > 50) {
      setIsOpen(true);
    }
  };

  const handleTouchEnd = () => {
    touchStartX.current = null;
  };

  const renderContent = () => {
    if (children != null) {
      return (
        <div className="side-drawer-content">
          {children}
        </div>
      );
    }

    // 默认内容
    return (
      <div className="side-drawer-content">
        <div className="side-drawer-header">
          <h3 className="side-drawer-title">设置</h3>
        </div>

        <div className="side-drawer-items">
          {showPlayback && (
            <div className="side-drawer-item">
              <div className="side-drawer-item-label">
                <span className="side-drawer-item-title">声音回放</span>
                <span className="side-drawer-item-desc">播放你录制的语音</span>
              </div>
              <label className="side-drawer-toggle">
                <input
                  type="checkbox"
                  checked={playbackEnabled}
                  onChange={(e) => onPlaybackToggle?.(e.target.checked)}
                />
                <span className="side-drawer-toggle-slider" />
              </label>
            </div>
          )}

          {showEffect && (
            <div className="side-drawer-item">
              <div className="side-drawer-item-label">
                <span className="side-drawer-item-title">交互特效</span>
                <span className="side-drawer-item-desc">选择录音时的视觉效果</span>
              </div>
              <select
                className="side-drawer-select"
                value={effectType}
                onChange={(e) =>
                  onEffectTypeChange?.(e.target.value as EffectType)
                }
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
          )}

          {showBackgroundSound && (
            <div className="side-drawer-item side-drawer-item--background-sound">
              <div className="side-drawer-item-label">
                <span className="side-drawer-item-title">背景音</span>
                <span className="side-drawer-item-desc">环境音与固定频率基调，助专注/放松/助眠</span>
              </div>
              <div className="side-drawer-background-sound-controls">
                <div className="side-drawer-background-sound-row">
                  <span className="side-drawer-background-sound-label">播放</span>
                  <label className="side-drawer-toggle">
                    <input
                      type="checkbox"
                      checked={backgroundSoundPlaying}
                      onChange={(e) =>
                        onBackgroundSoundChange?.({ playing: e.target.checked })
                      }
                    />
                    <span className="side-drawer-toggle-slider" />
                  </label>
                </div>
                <div className="side-drawer-background-sound-row">
                  <span className="side-drawer-background-sound-label">类型</span>
                  <select
                    className="side-drawer-select"
                    value={backgroundSoundType}
                    onChange={(e) =>
                      onBackgroundSoundChange?.({ type: e.target.value })
                    }
                  >
                    {backgroundSoundOptions.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="side-drawer-background-sound-row">
                  <span className="side-drawer-background-sound-label">固定频率基调</span>
                  <label className="side-drawer-toggle">
                    <input
                      type="checkbox"
                      checked={toneEnabled}
                      onChange={(e) =>
                        onBackgroundSoundChange?.({
                          toneEnabled: e.target.checked,
                          toneFrequency: e.target.checked ? toneFrequency : 0,
                        })
                      }
                    />
                    <span className="side-drawer-toggle-slider" />
                  </label>
                </div>
                <div className="side-drawer-background-sound-row">
                  <span className="side-drawer-background-sound-label">基调频率</span>
                  <select
                    className="side-drawer-select"
                    value={toneFrequency}
                    onChange={(e) =>
                      onBackgroundSoundChange?.({
                        toneFrequency: Number(e.target.value),
                      })
                    }
                  >
                    {toneFrequencyOptions.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          )}

          <div className="side-drawer-item">
            <div className="side-drawer-item-label">
              <span className="side-drawer-item-title">调试</span>
              <span className="side-drawer-item-desc">显示调试信息</span>
            </div>
            <label className="side-drawer-toggle">
              <input
                type="checkbox"
                checked={debugEnabled}
                onChange={(e) => onDebugToggle?.(e.target.checked)}
              />
              <span className="side-drawer-toggle-slider" />
            </label>
          </div>
        </div>
      </div>
    );
  };

  return (
    <>
      <div
        ref={triggerRef}
        className="side-drawer-trigger"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      />

      <div
        ref={drawerRef}
        className={`side-drawer ${isOpen ? 'side-drawer-open' : ''}`}
      >
        {renderContent()}
      </div>
    </>
  );
};

export const SideDrawer = Object.assign(SideDrawerBase, {
  Header: SideDrawerHeader,
  Item: SideDrawerItem,
  Toggle: SideDrawerToggle,
});
