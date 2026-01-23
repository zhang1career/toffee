import React, { useState, useCallback, useRef, useEffect } from 'react';
import { RippleEffect } from './RippleEffect';
import { SoundWave } from './SoundWave';
import { PulseWave } from './PulseWave';
import { RotatingRing } from './RotatingRing';
import { EnergyWave } from './EnergyWave';
import { SparkleEffect } from './SparkleEffect';
import { GradientRipple } from './GradientRipple';

export type EffectType = 
  | 'random' 
  | 'ripple' 
  | 'soundwave' 
  | 'pulsewave' 
  | 'rotatingring' 
  | 'energywave' 
  | 'sparkle' 
  | 'gradientripple';

interface EffectConfig {
  type: EffectType;
  x: number;
  y: number;
  timestamp: number;
  triggerKey: number;
}

interface InteractionEffectManagerProps {
  /** 是否激活 */
  active?: boolean;
  /** 触摸位置（像素） */
  touchX?: number;
  touchY?: number;
  /** 效果触发间隔（毫秒） */
  interval?: number;
  /** 效果数量变化回调 */
  onEffectCountChange?: (count: number) => void;
  /** 指定效果类型，'random' 表示随机 */
  effectType?: EffectType;
}

/**
 * 交互效果管理器 - 随机选择并显示交互效果
 * 跨端友好：纯CSS动画，Web/RN/Taro通用
 */
export const InteractionEffectManager: React.FC<InteractionEffectManagerProps> = ({
  active = false,
  touchX,
  touchY,
  interval = 300,
  onEffectCountChange,
  effectType = 'random',
}) => {
  const [effects, setEffects] = useState<EffectConfig[]>([]);
  const intervalRef = useRef<number | null>(null);
  const triggerKeyRef = useRef(0);

  // 通知效果数量变化
  useEffect(() => {
    onEffectCountChange?.(effects.length);
  }, [effects.length, onEffectCountChange]);

  // 随机选择效果类型
  const selectRandomEffect = useCallback((): EffectType => {
    const availableEffects: EffectType[] = [
      'ripple', 
      'soundwave', 
      'pulsewave',
      'rotatingring',
      'energywave',
      'sparkle',
      'gradientripple',
    ];
    const randomIndex = Math.floor(Math.random() * availableEffects.length);
    return availableEffects[randomIndex];
  }, []);

  // 获取要使用的效果类型
  const getEffectType = useCallback((): EffectType => {
    if (effectType === 'random') {
      return selectRandomEffect();
    }
    return effectType;
  }, [effectType, selectRandomEffect]);

  // 创建新效果
  const createEffect = useCallback(() => {
    if (!touchX || !touchY) return;

    // 跨平台获取屏幕尺寸
    let screenWidth: number;
    let screenHeight: number;
    try {
      const { Dimensions } = require('react-native');
      const { width, height } = Dimensions.get('window');
      screenWidth = width;
      screenHeight = height;
    } catch {
      // Web 环境
      screenWidth = typeof window !== 'undefined' ? window.innerWidth : 375;
      screenHeight = typeof window !== 'undefined' ? window.innerHeight : 667;
    }

    const xPercent = Math.max(0, Math.min(100, (touchX / screenWidth) * 100));
    const yPercent = Math.max(0, Math.min(100, (touchY / screenHeight) * 100));

    // 获取效果类型（随机或指定）
    const finalEffectType = getEffectType();
    triggerKeyRef.current += 1;

    const newEffect: EffectConfig = {
      type: finalEffectType,
      x: xPercent,
      y: yPercent,
      timestamp: Date.now(),
      triggerKey: triggerKeyRef.current,
    };

    setEffects((prev) => [...prev, newEffect]);

    // 根据效果类型设置清理时间
    const cleanupDelay = finalEffectType === 'soundwave' ? 2000 : 2000;
    setTimeout(() => {
      setEffects((prev) => prev.filter((e) => e.timestamp !== newEffect.timestamp));
    }, cleanupDelay);
  }, [touchX, touchY, getEffectType]);

  // 管理定时器
  useEffect(() => {
    if (active && touchX && touchY) {
      // 立即创建第一个效果
      createEffect();

      // 设置定时器持续创建效果
      intervalRef.current = window.setInterval(() => {
        createEffect();
      }, interval);

      return () => {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
      };
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      setEffects([]);
    }
  }, [active, touchX, touchY, interval, createEffect]);

  if (effects.length === 0) return null;

  return (
    <>
      {effects.map((effect) => {
        switch (effect.type) {
          case 'ripple':
            return (
              <RippleEffect
                key={`effect-${effect.timestamp}-${effect.triggerKey}`}
                trigger={effect.triggerKey > 0}
                x={effect.x}
                y={effect.y}
              />
            );
          case 'soundwave':
            return (
              <SoundWave
                key={`effect-${effect.timestamp}-${effect.triggerKey}`}
                active={true}
                x={effect.x}
                y={effect.y}
              />
            );
          case 'pulsewave':
            return (
              <div
                key={`effect-${effect.timestamp}-${effect.triggerKey}`}
                style={{
                  position: 'fixed',
                  left: `${effect.x}%`,
                  top: `${effect.y}%`,
                  transform: 'translate(-50%, -50%)',
                  width: '120px',
                  height: '120px',
                  pointerEvents: 'none',
                  zIndex: 1000,
                }}
              >
                <PulseWave active={true} />
              </div>
            );
          case 'rotatingring':
            return (
              <RotatingRing
                key={`effect-${effect.timestamp}-${effect.triggerKey}`}
                active={true}
                x={effect.x}
                y={effect.y}
              />
            );
          case 'energywave':
            return (
              <EnergyWave
                key={`effect-${effect.timestamp}-${effect.triggerKey}`}
                active={true}
                x={effect.x}
                y={effect.y}
              />
            );
          case 'sparkle':
            return (
              <SparkleEffect
                key={`effect-${effect.timestamp}-${effect.triggerKey}`}
                active={true}
                x={effect.x}
                y={effect.y}
              />
            );
          case 'gradientripple':
            return (
              <GradientRipple
                key={`effect-${effect.timestamp}-${effect.triggerKey}`}
                trigger={effect.triggerKey > 0}
                x={effect.x}
                y={effect.y}
              />
            );
          default:
            return null;
        }
      })}
    </>
  );
};

