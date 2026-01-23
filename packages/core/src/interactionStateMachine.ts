/**
 * 交互状态机
 * 平台无关的状态机实现，通过依赖注入传入平台特定功能
 */

import type {
  InteractionState,
  MutexLock,
  InteractionStateMachineConfig,
  InteractionCallbacks,
  AudioRecorder,
  AudioPlayer,
} from './types';

export class InteractionStateMachine {
  private state: InteractionState = 'idle';
  private config: InteractionStateMachineConfig;
  private callbacks: InteractionCallbacks;
  private recorder: AudioRecorder;
  private player: AudioPlayer;
  private mutexLock: MutexLock;
  
  // 内部状态
  private idleTimer: ReturnType<typeof setTimeout> | null = null;
  private touchStartTime: number = 0;
  private touchHoldTimer: ReturnType<typeof setTimeout> | null = null;
  private recordedBlob: Blob | null = null;
  private playbackEnabled: boolean = true;
  private echoDisplayTimer: ReturnType<typeof setTimeout> | null = null;
  private echoDisplayStartTime: number = 0;

  constructor(
    config: InteractionStateMachineConfig,
    callbacks: InteractionCallbacks,
    recorder: AudioRecorder,
    player: AudioPlayer,
    mutexLock: MutexLock,
    playbackEnabled: boolean = true
  ) {
    this.config = config;
    this.callbacks = callbacks;
    this.recorder = recorder;
    this.player = player;
    this.mutexLock = mutexLock;
    this.playbackEnabled = playbackEnabled;
    
    // 启动空闲检测
    this.startIdleTimer();
  }

  /**
   * 获取当前状态
   */
  getState(): InteractionState {
    return this.state;
  }

  /**
   * 设置回放开关
   */
  setPlaybackEnabled(enabled: boolean): void {
    this.playbackEnabled = enabled;
  }

  /**
   * 启动空闲计时器
   */
  private startIdleTimer(): void {
    this.clearIdleTimer();
    this.idleTimer = setTimeout(() => {
      if (this.state === 'idle') {
        this.transitionTo('showingGuide');
        this.callbacks.onShowGuide();
      }
    }, this.config.idleTimeout);
  }

  /**
   * 清除空闲计时器
   */
  private clearIdleTimer(): void {
    if (this.idleTimer) {
      clearTimeout(this.idleTimer);
      this.idleTimer = null;
    }
  }

  /**
   * 状态转换
   */
  private transitionTo(newState: InteractionState): void {
    if (this.state === newState) {
      return;
    }
    
    const oldState = this.state;
    this.state = newState;
    this.callbacks.onStateChange(newState);
    
    // 状态转换时的清理工作
    // 从 showingGuide 转换到其他状态时，隐藏引导词
    if (oldState === 'showingGuide' && newState !== 'showingGuide') {
      this.callbacks.onHideGuide();
    }
    
    // 转换到 showingEcho 时，总是隐藏引导词（无论当前状态是什么）
    // 这解决了首次启动时外部设置的引导词与回响文案重叠的问题
    if (newState === 'showingEcho') {
      this.callbacks.onHideGuide();
    }
    
    // 如果从 showingEcho 或 playback 转换到其他状态（除了 idle 到 showingEcho 或 playback），隐藏回响
    if ((oldState === 'showingEcho' || oldState === 'playback') && 
        newState !== 'showingEcho' && newState !== 'playback') {
      this.callbacks.onHideEcho();
    }
  }

  /**
   * 处理用户交互（触摸开始、点击等）
   * 重置空闲计时器
   */
  handleUserInteraction(): void {
    // 如果正在显示引导词，隐藏它
    if (this.state === 'showingGuide') {
      this.transitionTo('idle');
      this.callbacks.onHideGuide();
    }
    
    // 重置空闲计时器
    this.startIdleTimer();
  }

  /**
   * 处理触摸开始
   */
  async handleTouchStart(x: number, y: number): Promise<void> {
    // 如果当前正在显示回响或播放，先隐藏回响
    if (this.state === 'showingEcho' || this.state === 'playback') {
      this.callbacks.onHideEcho();
      // 清除 echoDisplayTimer，防止旧的定时器影响新的回响文案显示
      if (this.echoDisplayTimer) {
        clearTimeout(this.echoDisplayTimer);
        this.echoDisplayTimer = null;
      }
    }
    
    // 无论当前状态是什么，都隐藏引导词
    // 这解决了首次启动时外部设置的引导词与后续状态重叠的问题
    this.callbacks.onHideGuide();
    
    // 重置空闲计时器
    this.handleUserInteraction();
    
    // 清除旧的 timer，防止多个 timer 同时运行
    // 同时隐藏之前可能显示的效果，防止效果残留
    if (this.touchHoldTimer) {
      clearTimeout(this.touchHoldTimer);
      this.touchHoldTimer = null;
    }
    // 清除可能残留的动画效果
    this.callbacks.onHideEffects();
    
    // 记录触摸开始时间
    this.touchStartTime = Date.now();
    
    // 转换到 touchStart 状态
    this.transitionTo('touchStart');
    
    // 如果回放开关关闭，立即显示动画效果（不需要等待定时器）
    if (!this.playbackEnabled) {
      this.callbacks.onShowEffects(x, y);
    }
    
    // 保存定时器ID，用于后续清理
    const timerId = setTimeout(async () => {
      // 检查定时器是否已被清除（通过检查 touchHoldTimer 是否还是当前定时器）
      if (this.touchHoldTimer !== timerId) {
        console.debug('Timer cancelled: timer was cleared');
        return;
      }
      
      // 更严格的状态检查，防止在状态已改变时执行
      if (this.state !== 'touchStart') {
        console.debug('Timer cancelled: state changed to', this.state);
        // 确保清理效果
        this.callbacks.onHideEffects();
        return;
      }
      
      // 检查触摸时长是否达到阈值
      const touchDuration = Date.now() - this.touchStartTime;
      if (touchDuration < this.config.touchHoldThreshold) {
        // 时长不足，隐藏动画并返回空闲状态
        this.callbacks.onHideEffects();
        this.transitionTo('idle');
        return;
      }
      
      // 再次检查状态（在异步操作之前）
      if (this.state !== 'touchStart') {
        console.debug('Timer cancelled: state changed during threshold check');
        this.callbacks.onHideEffects();
        return;
      }
      
      // 尝试获取互斥锁
      try {
        await this.mutexLock.acquire();
      } catch (error) {
        // 获取锁失败，隐藏动画并返回空闲状态
        console.debug('Failed to acquire mutex lock:', error);
        this.callbacks.onHideEffects();
        this.transitionTo('idle');
        return;
      }
      
      // 获取锁后再次检查状态和定时器
      if (this.state !== 'touchStart' || this.touchHoldTimer !== timerId) {
        console.debug('Timer cancelled: state changed after acquiring lock or timer was cleared');
        this.mutexLock.release();
        this.callbacks.onHideEffects();
        return;
      }
      
      // 获取锁成功，关闭正在进行的录音和回放
      try {
        if (this.recorder.isRecording()) {
          await this.recorder.stop();
        }
      } catch (error) {
        console.debug('Error stopping recorder:', error);
      }
      
      try {
        if (this.player.isPlaying()) {
          await this.player.stop();
        }
      } catch (error) {
        console.debug('Error stopping player:', error);
      }
      
      // 等待音频会话完全清理（iOS 需要时间释放音频资源）
      // 增加等待时间，防止频繁操作导致音频会话冲突
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // 最后一次检查状态和定时器
      if (this.state !== 'touchStart' || this.touchHoldTimer !== timerId) {
        console.debug('Timer cancelled: state changed after stopping audio or timer was cleared');
        this.mutexLock.release();
        this.callbacks.onHideEffects();
        return;
      }
      
      // 显示动画效果（如果回放开关关闭，动画已经在触摸开始时显示，这里不需要再次显示）
      if (this.playbackEnabled) {
        this.callbacks.onShowEffects(x, y);
      }
      
      // 如果回放开关开启，开始录音
      if (this.playbackEnabled) {
        try {
          await this.recorder.start();
          // 再次检查状态，防止在录音启动过程中状态改变
          if (this.state === 'touchStart' && this.touchHoldTimer === timerId) {
            this.transitionTo('recording');
          } else {
            // 状态已改变，停止录音并清理
            try {
              await this.recorder.stop();
            } catch (error) {
              console.debug('Error stopping recorder after state change:', error);
            }
            this.mutexLock.release();
            this.callbacks.onHideEffects();
          }
        } catch (error) {
          console.error('Failed to start recording:', error);
          this.mutexLock.release();
          this.callbacks.onHideEffects();
          this.transitionTo('idle');
        }
      } else {
        // 回放开关关闭，不录音，但保持动画显示
        // 动画效果会在触摸结束时隐藏（在 handleTouchEnd 中处理）
        // 注意：互斥锁在 handleTouchEnd 中释放，这里不释放
        // 不调用 onHideEffects()，动画保持显示
        // 不转换状态，保持在 touchStart，等待用户松开
      }
    }, this.config.touchHoldThreshold);
    
    // 保存定时器ID
    this.touchHoldTimer = timerId;
  }

  /**
   * 处理触摸结束
   */
  async handleTouchEnd(): Promise<void> {
    // 清除触摸保持计时器（必须在最开始清除，防止定时器回调继续执行）
    const timerId = this.touchHoldTimer;
    if (this.touchHoldTimer) {
      clearTimeout(this.touchHoldTimer);
      this.touchHoldTimer = null;
    }
    
    // 检查触摸时长
    const touchDuration = Date.now() - this.touchStartTime;
    
    // 如果触摸时长小于阈值，延迟隐藏动画（让用户能看到动画效果）
    if (touchDuration < this.config.touchHoldThreshold) {
      // 如果回放开关关闭，延迟隐藏动画，让用户能看到效果
      if (!this.playbackEnabled) {
        // 延迟隐藏动画，给用户足够的时间看到效果
        setTimeout(() => {
          this.callbacks.onHideEffects();
        }, 300);
      } else {
        // 回放开关开启时，立即隐藏效果（防止定时器回调显示效果）
        if (timerId) {
          this.callbacks.onHideEffects();
        }
      }
      this.transitionTo('idle');
      return;
    }
    
    // 如果定时器还在运行，立即隐藏效果（防止定时器回调显示效果）
    if (timerId) {
      this.callbacks.onHideEffects();
    }
    
    // 如果正在录音，停止录音
    if (this.state === 'recording') {
      try {
        this.recordedBlob = await this.recorder.stop();
      } catch (error) {
        console.error('Failed to stop recording:', error);
        this.recordedBlob = null;
      }
    }
    
    // 隐藏动画效果（无论是否录音，触摸结束时都隐藏动画）
    this.callbacks.onHideEffects();
    
    // 显示回响（无论回放开关状态如何，都应该显示回响文案）
    this.transitionTo('showingEcho');
    this.echoDisplayStartTime = Date.now(); // 记录开始显示时间
    const echoCount = Math.floor(Math.random() * 2000) + 500;
    this.callbacks.onShowEcho(echoCount);
    
    // 释放互斥锁
    this.mutexLock.release();
    
    // 根据回放开关决定是否播放录音（但不影响回响文案的显示）
    if (this.playbackEnabled && this.recordedBlob) {
      try {
        this.transitionTo('playback');
        await this.player.play(this.recordedBlob);
        this.recordedBlob = null;
        
        // 播放完成，计算已显示时长
        const elapsedTime = Date.now() - this.echoDisplayStartTime;
        
        if (elapsedTime < this.config.echoDisplayDuration) {
          // 已显示时长不足，延迟剩余时间
          const remainingTime = this.config.echoDisplayDuration - elapsedTime;
          // 清除可能存在的旧定时器
          if (this.echoDisplayTimer) {
            clearTimeout(this.echoDisplayTimer);
          }
          this.echoDisplayTimer = setTimeout(() => {
            this.transitionTo('idle');
            this.startIdleTimer();
            this.echoDisplayTimer = null;
          }, remainingTime);
        } else {
          // 已显示时长足够，立即转换到idle
          this.transitionTo('idle');
          this.startIdleTimer();
        }
      } catch (error) {
        console.error('Failed to play recording:', error);
        // 播放失败，也应用相同的延迟逻辑
        const elapsedTime = Date.now() - this.echoDisplayStartTime;
        if (elapsedTime < this.config.echoDisplayDuration) {
          const remainingTime = this.config.echoDisplayDuration - elapsedTime;
          // 清除可能存在的旧定时器
          if (this.echoDisplayTimer) {
            clearTimeout(this.echoDisplayTimer);
          }
          this.echoDisplayTimer = setTimeout(() => {
            this.transitionTo('idle');
            this.startIdleTimer();
            this.echoDisplayTimer = null;
          }, remainingTime);
        } else {
          this.transitionTo('idle');
          this.startIdleTimer();
        }
      }
    } else {
      // 不需要播放，保持在 showingEcho 状态一段时间，展示回响文案
      // 延迟 echoDisplayDuration 后转换到 idle 状态
      this.echoDisplayTimer = setTimeout(() => {
        this.transitionTo('idle');
        this.startIdleTimer();
        this.echoDisplayTimer = null;
      }, this.config.echoDisplayDuration);
    }
  }

  /**
   * 清理资源
   */
  destroy(): void {
    this.clearIdleTimer();
    if (this.touchHoldTimer) {
      clearTimeout(this.touchHoldTimer);
      this.touchHoldTimer = null;
    }
    if (this.echoDisplayTimer) {
      clearTimeout(this.echoDisplayTimer);
      this.echoDisplayTimer = null;
    }
    // 确保释放互斥锁
    try {
      this.mutexLock.release();
    } catch (error) {
      // 忽略释放错误
    }
  }
}
