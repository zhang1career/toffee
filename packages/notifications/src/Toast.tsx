import React, { createContext, useCallback, useContext, useMemo, useRef, useState } from "react";
import { Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export type ToastLevel = "info" | "warning" | "error";

export type ToastShowOptions = {
  /** Semantic level; drives colors. Defaults to `"info"`. */
  level?: ToastLevel;
  /**
   * @deprecated Prefer {@link ToastShowOptions.level}. `error` maps to `"error"`, otherwise `"info"`.
   */
  variant?: "default" | "error";
  /** Auto-dismiss delay. Default `3200`. */
  durationMs?: number;
};

type ToastMessage = { id: number; text: string; level: ToastLevel };

type ToastApi = {
  show: (text: string, options?: ToastShowOptions) => void;
};

const ToastContext = createContext<ToastApi | null>(null);

const LEVEL_VISUAL: Record<
  ToastLevel,
  { backgroundColor: string; color: string; borderColor: string }
> = {
  info: {
    backgroundColor: "#166534",
    color: "#ecfdf5",
    borderColor: "#22c55e",
  },
  warning: {
    backgroundColor: "#a16207",
    color: "#fffbeb",
    borderColor: "#eab308",
  },
  error: {
    backgroundColor: "#b91c1c",
    color: "#fef2f2",
    borderColor: "#f87171",
  },
};

const DEFAULT_DURATION_MS = 3200;

function resolveLevel(options?: ToastShowOptions): ToastLevel {
  if (options?.level !== undefined && options.level !== null) {
    return options.level;
  }
  if (options?.variant === "error") {
    return "error";
  }
  return "info";
}

/**
 * Global top toast queue: level-colored banner, high z-index (web + native), tap to dismiss.
 * Wrap the app inside {@link SafeAreaProvider} (same as {@link NotificationBarProvider}).
 */
export function ToastProvider({ children }: { children: React.ReactNode }) {
  const insets = useSafeAreaInsets();
  const [queue, setQueue] = useState<ToastMessage[]>([]);
  const idRef = useRef(0);

  const show = useCallback((text: string, options?: ToastShowOptions) => {
    const level = resolveLevel(options);
    const durationMs = options?.durationMs ?? DEFAULT_DURATION_MS;
    const id = ++idRef.current;
    setQueue((q) => [...q, { id, text, level }]);
    setTimeout(() => {
      setQueue((q) => q.filter((m) => m.id !== id));
    }, durationMs);
  }, []);

  const value = useMemo(() => ({ show }), [show]);

  const active = queue[0];
  const topOffset = insets.top + (Platform.OS === "web" ? 72 : 12);

  return (
    <ToastContext.Provider value={value}>
      <View style={styles.shell} pointerEvents="box-none">
        {children}
        {active ? (
          <View style={[styles.anchor, { paddingTop: topOffset }]} pointerEvents="box-none">
            <Pressable
              onPress={() => setQueue((q) => q.filter((m) => m.id !== active.id))}
              style={[
                styles.banner,
                {
                  backgroundColor: LEVEL_VISUAL[active.level].backgroundColor,
                  borderColor: LEVEL_VISUAL[active.level].borderColor,
                },
              ]}
            >
              <Text style={[styles.bannerText, { color: LEVEL_VISUAL[active.level].color }]}>
                {active.text}
              </Text>
            </Pressable>
          </View>
        ) : null}
      </View>
    </ToastContext.Provider>
  );
}

const styles = StyleSheet.create({
  shell: {
    flex: 1,
  },
  anchor: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    zIndex: 200000,
    elevation: 50,
    alignItems: "center",
    paddingHorizontal: 16,
  },
  banner: {
    maxWidth: 560,
    width: "100%",
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  bannerText: {
    textAlign: "center",
    fontSize: 14,
    fontWeight: "600",
  },
});

export function useToast(): ToastApi {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error("useToast requires ToastProvider");
  }
  return ctx;
}
