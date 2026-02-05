import type {
  Phase,
  TextDisplayFireflyConfig,
  TextDisplayFireflyListener,
  TextItem,
} from './types';

export interface TextDisplayFireflyController {
  getItems: () => readonly TextItem[];
  addItem: () => void;
  onFadeInEnd: (id: number) => void;
  onFadeOutEnd: (id: number) => void;
  /** 将指定 id 的 visible 文案转为 fade-out */
  requestFadeOut: (id: number) => void;
  /** 将全部 visible/fade-in 文案转为 fade-out（由 cycle 定时器到期调用） */
  requestFadeOutAll: () => void;
  /** 下一次 addItem 的推荐延迟（毫秒） */
  getNextDelay: () => number;
  subscribe: (listener: TextDisplayFireflyListener) => () => void;
  getConfig: () => Readonly<TextDisplayFireflyConfig>;
}

export function createTextDisplayFirefly(
  config: TextDisplayFireflyConfig
): TextDisplayFireflyController {
  let items: TextItem[] = [];
  let nextId = 0;
  let cycleTimer: ReturnType<typeof setTimeout> | null = null;
  const listeners = new Set<TextDisplayFireflyListener>();

  function emit(): void {
    // 必须传与 getItems() 相同的引用，否则 useSyncExternalStore 会报 "getSnapshot should be cached"
    listeners.forEach((l) => l(items));
  }

  function requestFadeOut(id: number): void {
    const item = items.find((i) => i.id === id && i.phase === 'visible');
    if (!item) return;
    items = items.map((i) =>
      i.id === id ? { ...i, phase: 'fade-out' as Phase } : i
    );
    emit();
  }

  function requestFadeOutAll(): void {
    const hasAny = items.some(
      (i) => i.phase === 'visible' || i.phase === 'fade-in'
    );
    if (!hasAny) return;
    items = items.map((i) =>
      i.phase === 'visible' || i.phase === 'fade-in'
        ? { ...i, phase: 'fade-out' as Phase } : i
    );
    emit();
  }

  function addItem(): void {
    if (config.shouldAddItem && !config.shouldAddItem()) return;
    const text = config.getText();
    if (text == null) return;

    if (cycleTimer != null) {
      clearTimeout(cycleTimer);
      cycleTimer = null;
    }

    const newItem: TextItem = {
      id: nextId++,
      text,
      position: config.getPosition(),
      phase: 'fade-in',
    };

    items = [...items, newItem];
    emit();

    const life =
      config.lifeMinMs +
      Math.random() * (config.lifeMaxMs - config.lifeMinMs);
    const idle =
      config.idleMinMs +
      Math.random() * (config.idleMaxMs - config.idleMinMs);
    const delayMs = life + idle;
    cycleTimer = setTimeout(() => {
      cycleTimer = null;
      requestFadeOutAll();
    }, delayMs);
  }

  function onFadeInEnd(id: number): void {
    items = items.map((i) =>
      i.id === id && i.phase === 'fade-in'
        ? { ...i, phase: 'visible' as Phase } : i
    );
    emit();
  }

  function onFadeOutEnd(id: number): void {
    items = items.filter((i) => i.id !== id);
    emit();
    if (items.length === 0 && (!config.shouldAddItem || config.shouldAddItem())) {
      setTimeout(() => addItem(), 0);
    }
  }

  function getNextDelay(): number {
    return (
      config.lifeMinMs +
      Math.random() * (config.lifeMaxMs - config.lifeMinMs)
    );
  }

  function subscribe(listener: TextDisplayFireflyListener): () => void {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  }

  return {
    getItems: () => items,
    addItem,
    onFadeInEnd,
    onFadeOutEnd,
    requestFadeOut,
    requestFadeOutAll,
    getNextDelay,
    subscribe,
    getConfig: () => config,
  };
}
