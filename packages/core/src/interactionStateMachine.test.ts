import { describe, expect, test, vi, beforeEach, afterEach } from 'vitest';
import { InteractionStateMachine } from './interactionStateMachine';
import type { InteractionCallbacks, InteractionStateMachineConfig, AudioRecorder, AudioPlayer, MutexLock } from './types';

interface MockDeps {
  recorder: AudioRecorder & { setRecording: (value: boolean) => void };
  player: AudioPlayer;
  callbacks: InteractionCallbacks;
  mutex: MutexLock;
  config: InteractionStateMachineConfig;
  machine: InteractionStateMachine;
}

const createMocks = (overrides: Partial<InteractionStateMachineConfig> = {}, playbackEnabled = true): MockDeps => {
  let recording = false;
  const recorder: AudioRecorder & { setRecording: (value: boolean) => void } = {
    start: vi.fn().mockImplementation(async () => {
      recording = true;
    }),
    stop: vi.fn().mockImplementation(async () => {
      recording = false;
      return new Blob(['audio']);
    }),
    isRecording: vi.fn(() => recording),
    setRecording: (value: boolean) => {
      recording = value;
    },
  };

  let playing = false;
  const player: AudioPlayer = {
    play: vi.fn().mockImplementation(async () => {
      playing = true;
    }),
    getDuration: vi.fn().mockResolvedValue(1200),
    isPlaying: vi.fn(() => playing),
    stop: vi.fn().mockImplementation(async () => {
      playing = false;
    }),
  };

  const callbacks: InteractionCallbacks = {
    onShowGuide: vi.fn(),
    onHideGuide: vi.fn(),
    onShowEcho: vi.fn(),
    onHideEcho: vi.fn(),
    onShowEffects: vi.fn(),
    onHideEffects: vi.fn(),
    onStateChange: vi.fn(),
  };

  const mutex: MutexLock = {
    acquire: vi.fn().mockResolvedValue(undefined),
    release: vi.fn(),
  };

  const baseConfig: InteractionStateMachineConfig = {
    idleTimeout: 10_000,
    fadeTransitionDuration: 0,
    touchHoldThreshold: 50,
    echoDisplayDuration: 1_000,
    echoHideDelay: 300,
    minRecordingDurationForEcho: 500,
  };

  const config = { ...baseConfig, ...overrides };
  const machine = new InteractionStateMachine(config, callbacks, recorder, player, mutex, playbackEnabled);

  return { recorder, player, callbacks, mutex, config, machine };
};

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date('2024-01-01T00:00:00.000Z'));
});

afterEach(() => {
  vi.useRealTimers();
});

describe('InteractionStateMachine', () => {
  test('handleTouchStart transitions to recording and starts recorder', async () => {
    const { machine, recorder, callbacks, mutex } = createMocks();

    const startPromise = machine.handleTouchStart(10, 20);
    await vi.advanceTimersByTimeAsync(200); // debounce + cleanup delay
    await startPromise;

    expect(machine.getState()).toBe('recording');
    expect(mutex.acquire).toHaveBeenCalledTimes(1);
    expect(recorder.start).toHaveBeenCalledTimes(1);
    expect(callbacks.onShowEffects).toHaveBeenCalledWith(10, 20);
  });

  test('short press below debounce returns to idle and hides effects', async () => {
    const { machine, callbacks } = createMocks();

    const startPromise = machine.handleTouchStart(5, 6);
    await vi.advanceTimersByTimeAsync(10); // shorter than debounce
    await machine.handleTouchEnd();
    await vi.advanceTimersByTimeAsync(120); // allow debounce/cleanup to resolve
    await startPromise;

    expect(machine.getState()).toBe('idle');
    expect(callbacks.onHideEffects).toHaveBeenCalled();
  });

  test('playback disabled skips recording but still shows echo and returns idle after hide delay', async () => {
    const { machine, callbacks } = createMocks({ minRecordingDurationForEcho: 100 }, false);

    const startPromise = machine.handleTouchStart(0, 0);
    await vi.advanceTimersByTimeAsync(200);
    await startPromise;

    expect(machine.getState()).toBe('recording');

    await vi.advanceTimersByTimeAsync(150); // simulate holding long enough for echo
    await machine.handleTouchEnd();

    expect(machine.getState()).toBe('playback');
    expect(callbacks.onShowEcho).toHaveBeenCalledTimes(1);

    await vi.advanceTimersByTimeAsync(400); // allow echoHideDelay to elapse
    expect(machine.getState()).toBe('idle');
  });

  test('handleTouchEnd stops recording and kicks off playback when blob is valid', async () => {
    const { machine, recorder, player } = createMocks({ minRecordingDurationForEcho: 100 });

    const startPromise = machine.handleTouchStart(1, 1);
    await vi.advanceTimersByTimeAsync(200);
    await startPromise;

    recorder.setRecording(true);
    await vi.advanceTimersByTimeAsync(150);
    const endPromise = machine.handleTouchEnd();
    await vi.advanceTimersByTimeAsync(120); // cover playbackStartDelay without triggering echo hide
    await endPromise;

    expect(machine.getState()).toBe('playback');
    expect(recorder.stop).toHaveBeenCalledTimes(1);
    await Promise.resolve();
    expect(player.play).toHaveBeenCalledTimes(1);
  });

  test('playback disabled long press displays echo count', async () => {
    const { machine, callbacks } = createMocks({ minRecordingDurationForEcho: 100, echoHideDelay: 1_000, idleTimeout: 100 }, false);

    const startPromise = machine.handleTouchStart(0, 0);
    await vi.advanceTimersByTimeAsync(200);
    await startPromise;

    await vi.advanceTimersByTimeAsync(200);
    await machine.handleTouchEnd();

    expect(callbacks.onShowEcho).toHaveBeenCalledTimes(1);
    const [count] = callbacks.onShowEcho.mock.calls[0];
    expect(count).toBeGreaterThan(0);

    // 等待回响隐藏并进入空闲，再等待超时进入引导词
    await vi.advanceTimersByTimeAsync(1_200); // 1000 hide + buffer
    await vi.advanceTimersByTimeAsync(200); // idleTimeout to showingGuide
    expect(machine.getState()).toBe('showingGuide');

    // 第二次长按仍应显示回响文案
    const secondStart = machine.handleTouchStart(1, 1);
    await vi.advanceTimersByTimeAsync(200);
    await secondStart;
    await vi.advanceTimersByTimeAsync(200);
    await machine.handleTouchEnd();

    expect(callbacks.onShowEcho).toHaveBeenCalledTimes(2);
    const [secondCount] = callbacks.onShowEcho.mock.calls[1];
    expect(secondCount).toBeGreaterThan(0);
  });

  test('playback enabled long press displays echo count twice', async () => {
    const { machine, callbacks, recorder } = createMocks({ minRecordingDurationForEcho: 100, echoHideDelay: 1_000, idleTimeout: 100 });

    const firstStart = machine.handleTouchStart(2, 3);
    await vi.advanceTimersByTimeAsync(200);
    await firstStart;

    recorder.setRecording(true);
    await vi.advanceTimersByTimeAsync(200);
    const firstEnd = machine.handleTouchEnd();
    await vi.advanceTimersByTimeAsync(150);
    await firstEnd;

    expect(callbacks.onShowEcho).toHaveBeenCalledTimes(1);
    const [firstCount] = callbacks.onShowEcho.mock.calls[0];
    expect(firstCount).toBeGreaterThan(0);

    // 等待回响隐藏并进入空闲，再等待超时进入引导词
    await vi.advanceTimersByTimeAsync(1_200); // 1000 hide + buffer
    await vi.advanceTimersByTimeAsync(200); // idleTimeout to showingGuide
    expect(machine.getState()).toBe('showingGuide');

    const secondStart = machine.handleTouchStart(4, 5);
    await vi.advanceTimersByTimeAsync(200);
    await secondStart;

    recorder.setRecording(true);
    await vi.advanceTimersByTimeAsync(200);
    const secondEnd = machine.handleTouchEnd();
    await vi.advanceTimersByTimeAsync(150);
    await secondEnd;

    expect(callbacks.onShowEcho).toHaveBeenCalledTimes(2);
    const [secondCount] = callbacks.onShowEcho.mock.calls[1];
    expect(secondCount).toBeGreaterThan(0);
  });
});
