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

  // 新增内部状态变量
  private playbackStartTime: number = 0;  // 记录回放开始时间（用于计算延迟）
  private lastTouchTime: number = 0;  // 上次触摸时间（用于自适应防抖）
  private lastAudioSessionCleanupTime: number = 0;  // 上次音频会话清理时间（用于动态调整延迟）
  private isFirstAudioSessionCleanup: boolean = true;  // 是否首次清理（用于动态调整延迟）
  private touchStartSource: 'idle' | 'showingGuide' | 'playback' | null = null;  // 记录 touchStart 状态的转换来源
  private errorStack: Error[] = [];  // 错误栈（LIFO：后进先出，记录错误信息）
  private recordingStartTime: number = 0;  // 录音开始时间（用于计算录音时长）
  private recordingDuration: number = 0;  // 录音时长（毫秒），在 recordStop 时计算
  
  // 任务引用
  private recordingTaskRef: {
    promise: Promise<void>;
    abortController: AbortController;
    cancel: () => Promise<void>;
  } | null = null;
  
  private playbackTaskRef: {
    promise: Promise<void>;
    abortController: AbortController;
    retryCount: number;
    cancel: () => Promise<void>;
  } | null = null;
  
  // 合法的状态转换规则
  private readonly VALID_TRANSITIONS: Record<InteractionState, InteractionState[]> = {
    'idle': ['touchStart', 'showingGuide'],
    'showingGuide': ['touchStart', 'idle'],
    'touchStart': ['recording', 'idle', 'showingGuide', 'playback'], // 可以退回原状态
    'recording': ['recordStop', 'error'],
    'recordStop': ['playback', 'error'],
    'playback': ['touchStart', 'idle', 'error'],
    'error': ['idle'],
  };

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
    
    // 状态转换验证（可通过配置开启/关闭，默认开启）
    if (this.config.enableStateTransitionValidation !== false) {
      if (!this.isValidTransition(oldState, newState)) {
        console.warn(`[StateMachine] Invalid transition: ${oldState} -> ${newState}`);
        // 可以选择抛出错误或忽略（当前选择警告并继续）
      }
    }
    
    // 更新状态
    this.state = newState;
    
    // 统一的状态转换日志（可通过配置开启/关闭，默认关闭）
    // 对于关键状态转换，始终记录日志
    if (this.config.enableStateTransitionLogging || newState === 'playback' || oldState === 'playback') {
      console.debug(`[StateMachine] ${oldState} -> ${newState}`);
    }
    
    // 状态转换回调（可选）
    if (this.callbacks.onStateChange) {
      try {
        this.callbacks.onStateChange(oldState, newState);
      } catch (error) {
        console.error('Error in onStateChange callback:', error);
        // 回调错误不影响状态转换
      }
    }
    
    // 状态转换时的清理工作
    // 从 showingGuide 转换到其他状态时，隐藏引导词
    if (oldState === 'showingGuide' && newState !== 'showingGuide') {
      this.callbacks.onHideGuide();
    }
    
    // 转换到 touchStart 状态时，立即隐藏引导词（避免与回响文案重叠）
    if (newState === 'touchStart') {
      this.callbacks.onHideGuide();
    }
    
    // 如果从 playback 转换到其他状态（除了 touchStart），隐藏回响
    if (oldState === 'playback' && newState !== 'touchStart') {
      this.callbacks.onHideEcho();
    }
    
    // 转换到 error 状态时，确保隐藏动画
    if (newState === 'error') {
      this.callbacks.onHideEffects();
    }
    
    // 从 error 状态转换到其他状态时，确保隐藏动画（双重保险）
    if (oldState === 'error' && newState !== 'error') {
      this.callbacks.onHideEffects();
    }
    
    // 从 recording 状态转换到其他状态时，确保隐藏动画
    // 注意：只有在转换到 error 或 idle 时才停止录音器
    // 转换到 recordStop 时不应该停止（因为 handleTouchEnd 会处理）
    if (oldState === 'recording' && newState !== 'recording') {
      // 只有在转换到 recordStop 时才不隐藏动画（因为 recordStop 是瞬时状态，动画会在 handleTouchEnd 中隐藏）
      // 其他状态转换时都要隐藏动画，防止动画持续播放
      if (newState !== 'recordStop') {
        this.callbacks.onHideEffects();
      }
      // 如果离开 recording 状态但未进入 recordStop，清理录音计时器
      if (newState !== 'recordStop') {
        this.clearRecordingTimer();
      }
      // 只有在转换到 error 或 idle 时才停止录音器（防止录音器持续运行）
      // 转换到 recordStop 时不应该停止，因为这是正常的停止流程
      if ((newState === 'error' || newState === 'idle') && this.recorder.isRecording()) {
        this.recorder.stop().catch((error) => {
          const errorMessage = error instanceof Error ? error.message : String(error);
          if (!errorMessage.includes('Already stopped') && !errorMessage.includes('does not exist')) {
            console.error('[StateMachine] Failed to stop recorder in state transition:', error);
          }
        });
      }
    }
    
    // 进入 recording 状态时，启动录音计时器
    if (newState === 'recording' && oldState !== 'recording') {
      this.startRecordingTimer();
    }
    
    // 进入 recordStop 状态时，停止录音计时器并计算时长
    if (newState === 'recordStop' && oldState === 'recording') {
      this.stopRecordingTimer();
    }
  }
  
  /**
   * 验证状态转换的合法性
   */
  private isValidTransition(from: InteractionState, to: InteractionState): boolean {
    const validTargets = this.VALID_TRANSITIONS[from];
    if (!validTargets) {
      return false; // 未知的源状态
    }
    return validTargets.includes(to);
  }
  
  /**
   * 进入 idle 状态时调用（同步调用，清理动作本身是异步的）
   */
  private transitionToIdle(): void {
    this.transitionTo('idle');  // transitionTo 内部会处理日志、验证和回调
    
    // 隐藏回响文案（安全调用，即使没有显示过）
    this.callbacks.onHideEcho();
    
    // 确保隐藏动画（防止动画持续播放）
    this.callbacks.onHideEffects();
    
    // 清理录音计时器
    this.clearRecordingTimer();
    
    // 确保停止录音器（防止录音器持续运行）
    if (this.recorder.isRecording()) {
      this.recorder.stop().catch((error) => {
        const errorMessage = error instanceof Error ? error.message : String(error);
        if (!errorMessage.includes('Already stopped') && !errorMessage.includes('does not exist')) {
          console.error('[StateMachine] Failed to stop recorder in transitionToIdle:', error);
        }
      });
    }
    
    // 确保释放互斥锁
    try {
      this.mutexLock.release();
    } catch (e) {
      // 忽略释放错误（可能已经被释放）
    }
    
    // 同步调用清理动作（清理动作本身是异步的，不阻塞状态转换）
    this.cleanupAudioSession().catch((error) => {
      console.error('Failed to cleanup audio session in idle:', error);
    });
    
    // 启动空闲计时器
    this.startIdleTimer();
  }
  
  /**
   * 音频会话清理方法（抽取）
   * 优化：减少延迟，避免累积延迟影响响应速度
   */
  private async cleanupAudioSession(): Promise<void> {
    const now = Date.now();
    const timeSinceLastCleanup = now - this.lastAudioSessionCleanupTime;
    
    // 动态调整延迟：首次100ms，后续更短，避免累积延迟
    let delay: number;
    if (this.isFirstAudioSessionCleanup) {
      delay = this.config.audioSessionCleanupDelayFirst || 100;
      this.isFirstAudioSessionCleanup = false;
    } else if (timeSinceLastCleanup < 200) {
      // 非常快速操作时，不需要延迟（0ms）
      delay = 0;
    } else if (timeSinceLastCleanup < 500) {
      // 快速操作时使用更短延迟（从25ms减少到10ms）
      delay = 10;
    } else if (timeSinceLastCleanup < 1000) {
      // 中等间隔时使用中等延迟（保持50ms）
      delay = 50;
    } else {
      delay = this.config.audioSessionCleanupDelay || 75;
    }
    
    // 等待音频会话清理
    await new Promise(resolve => setTimeout(resolve, delay));
    this.lastAudioSessionCleanupTime = Date.now();
  }
  
  /**
   * 错误栈和错误状态管理
   */
  private pushError(error: Error): void {
    this.errorStack.push(error);  // LIFO：使用 push()
  }
  
  private transitionToError(): void {
    this.transitionTo('error');
    
    // 确保隐藏动画和引导词（如果之前显示了）
    this.callbacks.onHideEffects();
    this.callbacks.onHideGuide();
    // 确保隐藏回响文案（如果之前显示了，安全调用）
    this.callbacks.onHideEcho();
    
    // 清理录音计时器（如果正在录音）
    this.clearRecordingTimer();
    
    // 确保停止录音器（防止录音器持续运行）
    if (this.recorder.isRecording()) {
      this.recorder.stop().catch((error) => {
        const errorMessage = error instanceof Error ? error.message : String(error);
        if (!errorMessage.includes('Already stopped') && !errorMessage.includes('does not exist')) {
          console.error('[StateMachine] Failed to stop recorder in transitionToError:', error);
        }
      });
    }
    
    // 确保释放互斥锁
    try {
      this.mutexLock.release();
    } catch (e) {
      // 忽略释放错误（可能已经被释放）
    }
    
    // 弹出错误栈中的数据，打印日志（LIFO：后进先出，全部打印）
    while (this.errorStack.length > 0) {
      const error = this.errorStack.pop();  // LIFO：使用 pop() 而不是 shift()
      if (error) {
        console.error('State machine error:', error.message);
        console.error('Error stack:', error.stack);
      }
    }
    
    // 延迟后回到 idle（使用 transitionToIdle）
    setTimeout(() => {
      if (this.state === 'error') {
        this.transitionToIdle();
      }
    }, this.config.errorRecoveryDelay || 1000);
  }
  
  /**
   * 退回原状态的辅助方法
   */
  private returnToSourceState(): void {
    // 确保隐藏动画（如果之前显示了）
    this.callbacks.onHideEffects();
    
    // 确保释放互斥锁（如果持有）
    try {
      if (this.mutexLock) {
        this.mutexLock.release();
      }
    } catch (e) {
      // 忽略释放错误（可能已经被释放）
    }
    
    // 清理录音计时器
    this.clearRecordingTimer();
    
    // 退回 idle 或 showingGuide（不再支持从 playback 退回，因为 playback 状态时已经忽略按压）
    if (this.touchStartSource === 'showingGuide') {
      this.transitionTo('showingGuide');
    } else {
      this.transitionToIdle();  // 使用 transitionToIdle
    }
    this.touchStartSource = null;
  }
  
  /**
   * 自适应防抖延迟
   */
  private getAdaptiveDebounceDelay(): number {
    const now = Date.now();
    const timeSinceLastTouch = now - this.lastTouchTime;
    this.lastTouchTime = now;
    
    // 快速操作时进一步缩短防抖时间
    if (timeSinceLastTouch < 200) {
      // 非常快速操作时，使用更短的防抖时间（从30ms减少到20ms）
      return 20;
    } else if (timeSinceLastTouch < 500) {
      return 30; // 快速操作时30ms
    }
    
    return this.config.touchHoldThreshold || 50; // 默认50ms
  }

  /**
   * 处理用户交互（触摸开始、点击等）
   * 重置空闲计时器
   */
  handleUserInteraction(): void {
    // 如果正在显示引导词，隐藏它
    if (this.state === 'showingGuide') {
      this.transitionToIdle();
      this.callbacks.onHideGuide();
    }
    
    // 重置空闲计时器
    this.startIdleTimer();
  }
  
  /**
   * 录音任务管理
   */
  private async startRecordingTask(x: number, y: number): Promise<void> {
    // 取消之前的录音任务（优化：减少延迟，避免累积）
    if (this.recordingTaskRef) {
      try {
        // 保存任务引用，因为 cancel 可能会清空它
        const previousTask = this.recordingTaskRef;
        // 先清空引用，避免在 cancel 过程中被重复使用
        this.recordingTaskRef = null;
        // 然后取消任务（非阻塞，不等待完成，避免延迟累积）
        previousTask.cancel().catch(() => {});
        // 不需要等待，因为 cancel 已经是非阻塞的
      } catch (error) {
        console.error('[StateMachine] Error cancelling previous recording:', error);
        // 即使取消失败，也继续执行新的录音任务
        // 不需要等待
      }
    }
    
    const abortController = new AbortController();
    // 创建任务对象，保存引用以便 cancel 方法检查
    const task = {
      abortController,
      promise: this.recorder.start()
        .then(() => {
          if (!abortController.signal.aborted && this.state === 'recording') {
            // 录音任务已启动，状态保持在 recording
          }
        })
        .catch((error) => {
          if (!abortController.signal.aborted) {
            console.error('Recording start failed:', error);
            throw error;
          }
        }),
      cancel: async () => {
        abortController.abort();
        
        // 保存当前状态和任务引用，因为可能在取消过程中状态会改变
        const currentState = this.state;
        // 检查是否是当前任务：如果 recordingTaskRef 已经被清空或指向其他任务，说明这是旧任务
        const isCurrentTask = this.recordingTaskRef === task;
        
        try {
          // 无论是否是当前任务，都要停止录音器（避免录音器持续运行）
          if (this.recorder.isRecording()) {
            await this.recorder.stop();
          }
          
          // 清理资源
          this.recordedBlob = null;
          
          // 隐藏动画（但只有在 recording 状态且是当前任务时才隐藏，避免影响新的录音流程）
          // 如果是旧任务，新的录音流程可能正在显示动画，不应该隐藏
          if (currentState === 'recording' && this.state === 'recording' && isCurrentTask) {
            this.callbacks.onHideEffects();
          }
          // 释放互斥锁（如果持有）
          try {
            this.mutexLock.release();
          } catch (e) {
            // 忽略释放错误
          }
          // 更新状态（只有在 recording 状态且是当前任务时才转换，通过 error 状态转换到 idle，符合状态转换规则）
          // 注意：检查保存的状态和任务引用，避免取消旧任务时影响新任务
          if (currentState === 'recording' && this.state === 'recording' && isCurrentTask) {
            // 通过 error 状态转换到 idle（符合状态转换规则）
            this.pushError(new Error('Recording cancelled'));
            this.transitionToError();
          }
        } catch (error) {
          // 如果是 "Already stopped" 或文件不存在错误，这是正常的竞态条件，降级为 debug
          const errorMessage = error instanceof Error ? error.message : String(error);
          const isExpectedError = 
            errorMessage.includes('Already stopped') ||
            errorMessage.includes('does not exist');
          
          if (!isExpectedError) {
            console.error('[StateMachine] Error during recording cancellation:', error);
          }
          
          // 即使出错也要隐藏动画和停止录音器（但只有在 recording 状态时才隐藏，避免影响新的录音流程）
          if (currentState === 'recording' && this.state === 'recording') {
            this.callbacks.onHideEffects();
          }
          // 尝试停止录音器（即使之前失败了）
          try {
            if (this.recorder.isRecording()) {
              await this.recorder.stop();
            }
          } catch (stopError) {
            // 如果是 "Already stopped" 错误，这是正常的，不需要警告
            const stopErrorMessage = stopError instanceof Error ? stopError.message : String(stopError);
            if (!stopErrorMessage.includes('Already stopped')) {
              console.warn('[StateMachine] Failed to stop recorder in cancel error handler:', stopError);
            }
          }
          // 释放互斥锁
          try {
            this.mutexLock.release();
          } catch (e) {
            // 忽略释放错误
          }
          // 如果状态仍然是 recording 且是当前任务，通过 error 状态转换
          // 注意：检查保存的状态和任务引用，避免取消旧任务时影响新任务
          // 但如果是预期的错误（Already stopped），不需要转换到 error
          if (currentState === 'recording' && this.state === 'recording' && isCurrentTask && !isExpectedError) {
            this.pushError(error instanceof Error ? error : new Error(String(error)));
            this.transitionToError();
          }
          // 不抛出错误，因为这是取消操作，不应该中断流程
        }
      }
    };
    
    // 设置任务引用（在 cancel 方法定义之后，这样 cancel 可以检查引用）
    this.recordingTaskRef = task;
    return task.promise;
  }
  
  private async stopRecordingTask(): Promise<Blob | null> {
    // 如果回放开关关闭，没有录音任务，直接返回 null
    if (!this.playbackEnabled) {
      return null;
    }
    
    // 如果 recordingTaskRef 存在，使用它来停止
    if (this.recordingTaskRef) {
      this.recordingTaskRef = null;
      
      try {
        if (this.recorder.isRecording()) {
          this.recordedBlob = await this.recorder.stop();
          if (!this.recordedBlob || this.recordedBlob.size === 0) {
            return null;
          }
          return this.recordedBlob;
        }
        return null;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        const isExpectedError = 
          errorMessage.includes('Already stopped') ||
          errorMessage.includes('does not exist') ||
          errorMessage.includes('empty');
        
        if (!isExpectedError) {
          console.warn('[StateMachine] Error stopping recording:', error);
        }
        return null;
      }
    }
    
    // 如果 recordingTaskRef 不存在，但状态是 recording 或 recordStop，尝试直接停止录音器
    if ((this.state === 'recording' || this.state === 'recordStop') && this.recorder.isRecording()) {
      try {
        this.recordedBlob = await this.recorder.stop();
        if (!this.recordedBlob || this.recordedBlob.size === 0) {
          return null;
        }
        return this.recordedBlob;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        const isExpectedError = 
          errorMessage.includes('Already stopped') ||
          errorMessage.includes('does not exist') ||
          errorMessage.includes('empty');
        
        if (!isExpectedError) {
          console.warn('[StateMachine] Error stopping recording:', errorMessage);
        }
        return null;
      }
    }
    
    return null;
  }
  
  /**
   * 回放任务管理
   */
  private async startPlaybackTask(blob: Blob, retryCount: number = 0): Promise<void> {
    // 验证 Blob 有效性
    if (!blob || blob.size === 0) {
      console.warn('[StateMachine] Invalid blob for playback:', {
        isNull: !blob,
        size: blob?.size || 0
      });
      throw new Error('Invalid blob for playback: null or empty');
    }
    
    // 取消之前的回放任务
    // 注意：只有在状态不是 playback 时才取消，避免在 playback 状态时取消导致状态转换
    if (this.playbackTaskRef && this.state !== 'playback') {
      try {
        await this.playbackTaskRef.cancel();
      } catch (error) {
        console.error('[StateMachine] Error cancelling previous playback:', error);
      }
    }
    
    const abortController = new AbortController();
    const task = {
      abortController,
      retryCount,
      promise: this.player.play(blob)
        .then(() => {
          if (abortController.signal.aborted) {
            return;
          }
        })
        .catch((error) => {
          if (!abortController.signal.aborted) {
            console.error(`[StateMachine] Playback failed (attempt ${retryCount + 1}):`, error);
            throw error;
          }
        }),
      cancel: async () => {
        abortController.abort();
        try {
          if (this.player.isPlaying()) {
            await this.player.stop();
          }
          this.recordedBlob = null;
        } catch (error) {
          console.error('Error during playback cancellation:', error);
          throw error;
        }
      }
    };
    
    this.playbackTaskRef = task;
    return task.promise;
  }
  
  private async retryPlayback(blob: Blob, error: Error): Promise<void> {
    const currentTask = this.playbackTaskRef;
    if (!currentTask) return;
    
    const maxRetryCount = this.config.maxRetryCount || 3;
    // 检查是否应该重试
    const shouldRetry = 
      currentTask.retryCount < maxRetryCount &&
      (error.message.includes('audio session') || 
       error.message.includes('busy') ||
       error.message.includes('conflict'));
    
    if (shouldRetry) {
      const retryDelay = 100 * (currentTask.retryCount + 1);
      await new Promise(resolve => setTimeout(resolve, retryDelay));
      
      try {
        await this.startPlaybackTask(blob, currentTask.retryCount + 1);
      } catch (retryError) {
        console.error('Retry failed:', retryError);
        // 重试失败，通知用户或回退状态
        this.handlePlaybackError(retryError instanceof Error ? retryError : new Error(String(retryError)));
      }
    } else {
      // 不再重试，处理错误
      this.handlePlaybackError(error);
    }
  }
  
  private handlePlaybackError(error: Error): void {
    // 关键错误处理：通知用户或回退状态
    console.error('Critical playback error:', error);
    // 回响文案仍然显示，但标记播放失败
    // 可以添加用户通知：this.callbacks.onError?.('播放失败');
  }
  
  /**
   * 安排回响文案隐藏
   */
  private scheduleEchoHide(): void {
    // 清除旧的定时器
    if (this.echoDisplayTimer) {
      clearTimeout(this.echoDisplayTimer);
    }
    
    // 计算已过去的时间
    const elapsedTime = Date.now() - this.playbackStartTime;
    const remainingTime = Math.max(
      (this.config.echoHideDelay || 2000) - elapsedTime,
      0
    );

    // 设置定时器
    this.echoDisplayTimer = setTimeout(() => {
      if (this.state === 'playback') {  // 检查状态是否仍然是 playback
        this.transitionToIdle();
      }
      this.echoDisplayTimer = null;
    }, remainingTime);
  }

  /**
   * 处理触摸开始
   * idle/showingGuide/playback -> touchStart
   */
  async handleTouchStart(x: number, y: number): Promise<void> {
    // 如果已经在 recording 状态，忽略新的按压
    // 但如果录音器没有在运行，说明状态不一致，需要清理
    if (this.state === 'recording') {
      if (!this.recorder.isRecording()) {
        // 状态是 recording 但录音器没有运行，说明状态不一致，需要清理
        console.warn('[StateMachine] State is recording but recorder is not active, cleaning up...');
        // 隐藏动画
        this.callbacks.onHideEffects();
        // 释放互斥锁
        try {
          this.mutexLock.release();
        } catch (e) {
          // 忽略释放错误
        }
        // 转换到 idle 状态
        this.transitionToIdle();
        // 然后继续处理新的触摸（不返回）
      } else {
        return;
      }
    }
    
    // 如果已经在 touchStart 状态，忽略新的按压
    if (this.state === 'touchStart') {
      return;
    }
    
    // 如果状态是 recordStop，忽略按压（与 recording 状态一致）
    if (this.state === 'recordStop') {
      return;
    }
    
    // 如果状态是 error，忽略按压（等待错误恢复完成）
    if (this.state === 'error') {
      return;
    }
    
    // 记录转换来源
    if (this.state === 'idle' || this.state === 'showingGuide') {
      this.touchStartSource = this.state;
      
      // 清理之前的录音计时器（开始新的录音流程）
      this.clearRecordingTimer();
    }
    
    // 转换到 touchStart 状态
    this.transitionTo('touchStart');
    this.touchStartTime = Date.now();
    
    // 等待50ms阈值（自适应消抖）
    await new Promise(resolve => setTimeout(resolve, this.getAdaptiveDebounceDelay()));
    
    // 检查消抖条件：如果按压时长<50ms，退回原状态
    // 注意：如果用户在等待期间松开，handleTouchEnd 会处理退回逻辑
    const touchDuration = Date.now() - this.touchStartTime;
    if (touchDuration < this.getAdaptiveDebounceDelay()) {
      // 退回原状态
      this.returnToSourceState();
      return;
    }
    
    // 检查状态是否仍然是 touchStart（可能在等待期间状态已改变）
    if (this.getState() !== 'touchStart') {
      return;
    }
    
    // 获取互斥锁（在转换过程中获取）
    try {
      await this.mutexLock.acquire();
    } catch (error) {
      // 获取锁失败，转到 error 状态
      this.pushError(error instanceof Error ? error : new Error(String(error)));
      this.transitionToError();
      return;
    }
    
    // 再次检查状态（获取锁后）
    if (this.getState() !== 'touchStart') {
      // 状态已改变（可能用户在等待期间松开了），释放锁并返回
      this.mutexLock.release();
      return;
    }
    
    // 转换到 recording 状态
    this.transitionTo('recording');
    
    // 先显示动画（在清理音频会话之前，确保动画及时显示）
    try {
      this.callbacks.onShowEffects(x, y);
    } catch (error) {
      console.warn('Failed to show effects:', error);
      // 继续执行
    }
    
    // 隐藏回响文案（如果有，避免与新的录音流程冲突）
    this.callbacks.onHideEcho();
    
    try {
      // 清理音频会话（优化：减少延迟，避免累积）
      await this.cleanupAudioSession();
    } catch (error) {
      // 清理失败，转到 error 状态
      this.mutexLock.release();
      this.callbacks.onHideEffects(); // 确保隐藏动画
      this.pushError(error instanceof Error ? error : new Error(String(error)));
      this.transitionToError();
      return;
    }
    
    // 如果回放开关关闭，不启动录音任务，但保留动画和状态
    if (!this.playbackEnabled) {
      return;
    }
    
    // 启动录音任务（异步，失败时转到 error 状态）
    try {
      await this.startRecordingTask(x, y);
    } catch (error) {
      // 启动录音失败，转到 error 状态
      this.mutexLock.release();
      this.callbacks.onHideEffects();
      this.pushError(error instanceof Error ? error : new Error(String(error)));
      this.transitionToError();
      return;
    }
    
    // 清除转换来源记录
    this.touchStartSource = null;
  }
  
  /**
   * 处理触摸结束
   * recording -> recordStop（瞬时状态）-> playback
   */
  async handleTouchEnd(): Promise<void> {
    // 清除触摸保持计时器
    if (this.touchHoldTimer) {
      clearTimeout(this.touchHoldTimer);
      this.touchHoldTimer = null;
    }
    
    // 如果状态是 touchStart，检查按压时长，决定是否退回原状态
    if (this.state === 'touchStart') {
      const touchDuration = Date.now() - this.touchStartTime;
      if (touchDuration < this.getAdaptiveDebounceDelay()) {
        // 按压时长<50ms，退回原状态
        // 注意：如果 handleTouchStart 已经获取了互斥锁，会在状态检查时释放
        // 这里不需要检查锁的状态，因为 handleTouchStart 会在状态改变时自动释放
        // 确保隐藏动画（如果之前显示了）
        this.callbacks.onHideEffects();
        this.returnToSourceState();
        return;
      }
      // 如果按压时长≥50ms，但还没有转换到 recording，可能需要等待
      // 或者直接返回，等待 handleTouchStart 中的转换完成
      // 这里先返回，让 handleTouchStart 继续处理
      // 注意：如果 handleTouchStart 已经获取了互斥锁，会在状态检查时释放
      return;
    }
    
    // 如果状态是 playback，检查是否有正在进行的播放任务，但不取消（让播放自然完成）
    if (this.state === 'playback') {
      return;
    }
    
    // 如果状态是 recordStop，忽略（瞬时状态，正在转换中）
    if (this.state === 'recordStop') {
      return;
    }
    
    // 检查当前状态
    if (this.state !== 'recording') {
      // 如果不在录音状态，但录音器仍在运行，需要清理
      // 这可能发生在频繁点击时，状态已经被转换（例如转换到 error），但录音器仍在运行
      if (this.recorder.isRecording()) {
        try {
          // 停止录音器
          await this.recorder.stop();
          // 隐藏动画
          this.callbacks.onHideEffects();
          // 释放互斥锁
          try {
            this.mutexLock.release();
          } catch (e) {
            // 忽略释放错误
          }
        } catch (error) {
          // 如果是 "Already stopped" 或文件不存在错误，这是正常的竞态条件
          const errorMessage = error instanceof Error ? error.message : String(error);
          if (errorMessage.includes('Already stopped') || errorMessage.includes('does not exist')) {
            // 即使停止失败，也要隐藏动画和释放锁
            this.callbacks.onHideEffects();
            try {
              this.mutexLock.release();
            } catch (e) {
              // 忽略释放错误
            }
          } else {
            console.error('[StateMachine] Failed to cleanup recorder:', error);
          }
        }
      }
      return;
    }
    
    // 转换到 recordStop 状态（瞬时状态）
    this.transitionTo('recordStop');
    
    // 立即执行UI更新（不等待停止完成）
    this.callbacks.onHideEffects();
    
    // 释放互斥锁
    try {
      this.mutexLock.release();
    } catch (e) {
      // 忽略释放错误（可能已经被释放）
    }

    // 停止录音任务（等待完成，确保 recordedBlob 已设置）
    // 如果回放开关关闭，不需要停止录音（因为没有启动录音）
    let recordedBlob: Blob | null = null;
    if (this.playbackEnabled) {
      try {
        recordedBlob = await this.stopRecordingTask();
      } catch (error) {
        console.error('[StateMachine] Failed to stop recording:', error);
        // 即使停止失败，也继续流程（但 recordedBlob 可能为 null）
      }
    }

    // 检查状态是否在等待期间被改变（例如被取消操作转换到 error）
    const currentState1 = this.getState();
    if (currentState1 !== 'recordStop' && currentState1 !== 'playback') {
      return;
    }
    
    // 验证 recordedBlob 有效性
    // 如果回放开关关闭，recordedBlob 可能为 null（因为没有录音），这是正常的
    if (!recordedBlob || recordedBlob.size === 0) {
      // 转换到 playback 状态
      this.transitionTo('playback');
      this.playbackStartTime = Date.now();

      // 检查录音时长是否达到显示回响文案的阈值
      const minDuration = this.config.minRecordingDurationForEcho || 1000;
      const shouldShowEcho = this.recordingDuration >= minDuration;

      // 只有录音时长达到阈值时才显示回响文案
      if (shouldShowEcho) {
        const echoCount = Math.floor(Math.random() * 2000) + 500;
        this.callbacks.onShowEcho(echoCount);
        this.scheduleEchoHide();
      } else {
        this.callbacks.onHideEcho();
        this.clearRecordingTimer();
      }
      return;
    }
    
    // 更新 recordedBlob（确保使用最新值）
    this.recordedBlob = recordedBlob;
    
    // 保存 recordedBlob 的引用，防止在等待期间被修改
    const blobToPlay = recordedBlob;
    
    // 延迟后转换到 playback 状态
    await new Promise(resolve => setTimeout(resolve, this.config.playbackStartDelay || 50));

    // 检查状态是否在等待期间被改变（例如被取消操作转换到 error）
    const currentState2 = this.getState();
    if (currentState2 !== 'recordStop' && currentState2 !== 'playback') {
      return;
    }
    
    // 转换到 playback 状态
    this.transitionTo('playback');
    this.playbackStartTime = Date.now();

    // 检查录音时长是否达到显示回响文案的阈值
    const minDuration = this.config.minRecordingDurationForEcho || 1000;
    const shouldShowEcho = this.recordingDuration >= minDuration;

    // 只有录音时长达到阈值时才显示回响文案
    if (shouldShowEcho) {
      const echoCount = Math.floor(Math.random() * 2000) + 500;
      this.callbacks.onShowEcho(echoCount);
    } else {
      this.callbacks.onHideEcho();
    }
    
    // 检查回放开关状态
    if (!this.playbackEnabled) {
      if (shouldShowEcho) {
        this.scheduleEchoHide();
      } else {
        this.callbacks.onHideEcho();
        this.clearRecordingTimer();
      }
      return;
    }
    
    // 使用保存的 blobToPlay，防止在等待期间 recordedBlob 被修改
    if (blobToPlay && blobToPlay.size > 0) {
      this.startPlaybackTask(blobToPlay)
        .then(() => {
          if (shouldShowEcho) {
            this.scheduleEchoHide();
          } else {
            this.callbacks.onHideEcho();
            this.clearRecordingTimer();
          }
        })
        .catch((error) => {
          console.error('[StateMachine] Playback failed:', error);
          this.retryPlayback(blobToPlay, error instanceof Error ? error : new Error(String(error)));
        });
    } else {
      console.warn('[StateMachine] Recorded blob became invalid, skipping playback');
      if (shouldShowEcho) {
        this.scheduleEchoHide();
      } else {
        this.callbacks.onHideEcho();
        this.clearRecordingTimer();
      }
    }
  }

  /**
   * 启动录音计时器
   */
  private startRecordingTimer(): void {
    this.recordingStartTime = Date.now();
    this.recordingDuration = 0;
  }
  
  /**
   * 停止录音计时器并计算时长
   */
  private stopRecordingTimer(): void {
    if (this.recordingStartTime > 0) {
      this.recordingDuration = Date.now() - this.recordingStartTime;
    } else {
      this.recordingDuration = 0;
    }
  }
  
  /**
   * 清理录音计时器（在状态转换到其他状态时调用）
   */
  private clearRecordingTimer(): void {
    this.recordingStartTime = 0;
    this.recordingDuration = 0;
  }
  
  /**
   * 清理资源
   */
  destroy(): void {
    this.clearIdleTimer();
    this.clearRecordingTimer();
    if (this.touchHoldTimer) {
      clearTimeout(this.touchHoldTimer);
      this.touchHoldTimer = null;
    }
    if (this.echoDisplayTimer) {
      clearTimeout(this.echoDisplayTimer);
      this.echoDisplayTimer = null;
    }
    
    // 确保隐藏动画和回响文案
    this.callbacks.onHideEffects();
    this.callbacks.onHideEcho();
    this.callbacks.onHideGuide();
    
    // 确保停止录音器（防止录音器持续运行）
    if (this.recorder.isRecording()) {
      this.recorder.stop().catch((error) => {
        const errorMessage = error instanceof Error ? error.message : String(error);
        if (!errorMessage.includes('Already stopped') && !errorMessage.includes('does not exist')) {
          console.error('[StateMachine] Failed to stop recorder in destroy:', error);
        }
      });
    }
    
    // 取消正在进行的任务
    if (this.recordingTaskRef) {
      this.recordingTaskRef.cancel().catch(() => {});
      this.recordingTaskRef = null;
    }
    if (this.playbackTaskRef) {
      this.playbackTaskRef.cancel().catch(() => {});
      this.playbackTaskRef = null;
    }
    
    // 确保释放互斥锁
    try {
      this.mutexLock.release();
    } catch (error) {
      // 忽略释放错误
    }
  }
}
