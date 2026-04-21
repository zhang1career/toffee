/**
 * Sliding-window rate limit for async work (e.g. outbound HTTP).
 * Callers pass the real request as a callback; the limiter decides when it may start.
 */

export type RateLimitStrategy = "wait" | "reject";

export type RateLimitOptions = {
  /** Length of the sliding window (e.g. 60_000 for per-minute caps). */
  windowMs: number;
  /** Maximum number of started calls within the window. */
  maxCalls: number;
  /** When the window is full: wait for the next slot, or fail fast. Default `"wait"`. */
  strategy?: RateLimitStrategy;
};

export class RateLimitError extends Error {
  override readonly name = "RateLimitError";

  constructor(
    message: string,
    readonly retryAfterMs: number,
  ) {
    super(message);
  }
}

class AsyncMutex {
  private chain: Promise<void> = Promise.resolve();

  runExclusive<T>(fn: () => Promise<T>): Promise<T> {
    const next = this.chain.then(fn);
    this.chain = next.then(
      () => undefined,
      () => undefined,
    );
    return next;
  }
}

function delay(ms: number): Promise<void> {
  if (ms <= 0) {
    return Promise.resolve();
  }
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

export type RateLimiter = {
  schedule<T>(fn: () => Promise<T>): Promise<T>;
};

export function createRateLimiter(options: RateLimitOptions): RateLimiter {
  const windowMs = options.windowMs;
  const maxCalls = options.maxCalls;
  const strategy = options.strategy ?? "wait";
  const timestamps: number[] = [];
  const mutex = new AsyncMutex();

  function prune(now: number): void {
    const cutoff = now - windowMs;
    while (timestamps.length > 0 && timestamps[0]! < cutoff) {
      timestamps.shift();
    }
  }

  async function acquireSlot(): Promise<void> {
    for (;;) {
      const pass = await mutex.runExclusive(async () => {
        const now = Date.now();
        prune(now);
        if (timestamps.length < maxCalls) {
          timestamps.push(now);
          return true;
        }
        if (strategy === "reject") {
          const oldest = timestamps[0]!;
          const retryAfterMs = Math.max(0, oldest + windowMs - now);
          throw new RateLimitError(
            `Rate limit exceeded: max ${maxCalls} call(s) per ${windowMs}ms`,
            retryAfterMs,
          );
        }
        const oldest = timestamps[0]!;
        const waitMs = Math.max(0, oldest + windowMs - now);
        return waitMs;
      });

      if (pass === true) {
        return;
      }
      await delay(pass + 1);
    }
  }

  return {
    schedule<T>(fn: () => Promise<T>): Promise<T> {
      return acquireSlot().then(fn);
    },
  };
}

const keyedLimiters = new Map<string, RateLimiter>();

function getOrCreateKeyedLimiter(key: string, options: RateLimitOptions): RateLimiter {
  let limiter = keyedLimiters.get(key);
  if (!limiter) {
    limiter = createRateLimiter(options);
    keyedLimiters.set(key, limiter);
  }
  return limiter;
}

/**
 * Wrap an async function with a sliding-window rate limit.
 *
 * @param fn - The real async work (e.g. `fetch`).
 * @param options - Window size and max starts per window.
 * @param key - Optional; same key shares one limiter instance (e.g. per endpoint).
 */
export function wrapAsyncWithRateLimit<T extends unknown[], R>(
  fn: (...args: T) => Promise<R>,
  options: RateLimitOptions,
  key?: string,
): (...args: T) => Promise<R> {
  const limiter =
    key !== undefined ? getOrCreateKeyedLimiter(key, options) : createRateLimiter(options);
  return (...args: T) => limiter.schedule(() => fn(...args));
}

/**
 * Options-first helper, closer to an “annotation” on the operation.
 */
export function withRateLimit<T extends unknown[], R>(
  options: RateLimitOptions,
  fn: (...args: T) => Promise<R>,
  key?: string,
): (...args: T) => Promise<R> {
  return wrapAsyncWithRateLimit(fn, options, key);
}
