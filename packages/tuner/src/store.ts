import type { TunableEntry } from './types';

type Subscriber = () => void;

const NOTIFY_THROTTLE_MS = 200;

class TunerStoreClass {
  private entries = new Map<string, TunableEntry>();
  private subscribers = new Set<Subscriber>();
  /** 缓存 getAll() 结果，避免每次返回新数组导致 useSyncExternalStore 误判变化、无限重渲染 */
  private cachedGetAll: TunableEntry[] | null = null;
  /** setValue 触发的 notify 节流，避免滑动条拖动时 60fps 全树重渲染导致发热 */
  private notifyTimeoutId: ReturnType<typeof setTimeout> | null = null;

  register(name: string, initialValue: number, options?: { min?: number; max?: number; step?: number }): void {
    this.entries.set(name, {
      name,
      value: initialValue,
      min: options?.min,
      max: options?.max,
      step: options?.step,
    });
    this.notify();
  }

  unregister(name: string): void {
    this.entries.delete(name);
    this.notify();
  }

  getValue(name: string): number | undefined {
    return this.entries.get(name)?.value;
  }

  setValue(name: string, value: number): void {
    const entry = this.entries.get(name);
    if (!entry) return;

    let clamped = value;
    if (entry.min != null && clamped < entry.min) clamped = entry.min;
    if (entry.max != null && clamped > entry.max) clamped = entry.max;
    if (entry.step != null && entry.step > 0) {
      clamped = Math.round(clamped / entry.step) * entry.step;
    }

    entry.value = clamped;
    this.cachedGetAll = null;
    this.scheduleThrottledNotify();
  }

  getAll(): TunableEntry[] {
    if (this.cachedGetAll === null) {
      this.cachedGetAll = Array.from(this.entries.values());
    }
    return this.cachedGetAll;
  }

  subscribe(callback: Subscriber): () => void {
    this.subscribers.add(callback);
    return () => this.subscribers.delete(callback);
  }

  /** 立即触发一次 notify（如滑动条松手时），避免最终值延迟显示 */
  flushNotify(): void {
    if (this.notifyTimeoutId !== null) {
      clearTimeout(this.notifyTimeoutId);
      this.notifyTimeoutId = null;
    }
    this.notify();
  }

  private scheduleThrottledNotify(): void {
    if (this.notifyTimeoutId !== null) return;
    this.notifyTimeoutId = setTimeout(() => {
      this.notifyTimeoutId = null;
      this.notify();
    }, NOTIFY_THROTTLE_MS);
  }

  private notify(): void {
    this.cachedGetAll = null;
    this.subscribers.forEach((cb) => cb());
  }
}

export const TunerStore = new TunerStoreClass();
