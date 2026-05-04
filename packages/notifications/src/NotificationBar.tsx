import React, { createContext, useCallback, useContext, useMemo, useRef, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export type NotificationVariant = "info" | "error";

type Entry = {
  id: number;
  message: string;
  variant: NotificationVariant;
};

export type ShowNotificationOptions = {
  variant?: NotificationVariant;
  durationMs?: number;
};

export type NotificationBarApi = {
  show: (message: string, options?: ShowNotificationOptions) => void;
  dismissCurrent: () => void;
};

const NotificationBarContext = createContext<NotificationBarApi | null>(null);

const DEFAULT_DURATION_MS = 5200;

/**
 * Top inset-aware banner: short message, manual dismiss (×), auto-hide after `durationMs`.
 */
export function NotificationBarProvider({ children }: { children: React.ReactNode }) {
  const insets = useSafeAreaInsets();
  const [current, setCurrent] = useState<Entry | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearTimer = useCallback(() => {
    if (timerRef.current !== null) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const dismissCurrent = useCallback(() => {
    clearTimer();
    setCurrent(null);
  }, [clearTimer]);

  const show = useCallback(
    (message: string, options?: ShowNotificationOptions) => {
      clearTimer();
      const id = Date.now();
      const variant = options?.variant ?? "info";
      const durationMs = options?.durationMs ?? DEFAULT_DURATION_MS;
      setCurrent({ id, message, variant });
      timerRef.current = setTimeout(() => {
        setCurrent((c) => (c?.id === id ? null : c));
        timerRef.current = null;
      }, durationMs);
    },
    [clearTimer],
  );

  const value = useMemo(() => ({ show, dismissCurrent }), [show, dismissCurrent]);

  const stylesForVariant =
    current?.variant === "error"
      ? { bg: "#7f1d1d" as const, border: "#fecaca" as const }
      : { bg: "#1e293b" as const, border: "#475569" as const };

  return (
    <NotificationBarContext.Provider value={value}>
      {children}
      {current ? (
        <View pointerEvents="box-none" style={[StyleSheet.absoluteFillObject, { zIndex: 9999 }]}>
          <View style={{ paddingTop: insets.top + 8, paddingHorizontal: 12 }}>
            <View
              style={{
                backgroundColor: stylesForVariant.bg,
                borderWidth: 1,
                borderColor: stylesForVariant.border,
                borderRadius: 12,
                flexDirection: "row",
                alignItems: "center",
                paddingVertical: 12,
                paddingHorizontal: 14,
                gap: 10,
              }}
            >
              <Text style={{ flex: 1, color: "#f8fafc", fontSize: 14 }}>{current.message}</Text>
              <Pressable
                onPress={dismissCurrent}
                accessibilityRole="button"
                accessibilityLabel="Dismiss notification"
                hitSlop={12}
              >
                <Text style={{ color: "#cbd5e1", fontSize: 20, fontWeight: "600" }}>×</Text>
              </Pressable>
            </View>
          </View>
        </View>
      ) : null}
    </NotificationBarContext.Provider>
  );
}

export function useNotificationBar(): NotificationBarApi {
  const ctx = useContext(NotificationBarContext);
  if (!ctx) {
    throw new Error("useNotificationBar requires NotificationBarProvider");
  }
  return ctx;
}
