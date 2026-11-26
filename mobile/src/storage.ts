import AsyncStorage from "@react-native-async-storage/async-storage";
import { useEffect, useRef, useState } from "react";

const PREFIX = "thursday.mobile.v2.";

export function usePersistentState<T>(key: string, initialValue: T) {
  const storageKey = `${PREFIX}${key}`;
  const [state, setState] = useState<T>(initialValue);
  const hydrated = useRef(false);

  useEffect(() => {
    let active = true;
    AsyncStorage.getItem(storageKey)
      .then((raw) => {
        if (active && raw !== null) {
          setState(JSON.parse(raw));
        }
      })
      .catch(() => {})
      .finally(() => {
        hydrated.current = true;
      });
    return () => {
      active = false;
    };
  }, [storageKey]);

  useEffect(() => {
    if (!hydrated.current) return;
    AsyncStorage.setItem(storageKey, JSON.stringify(state)).catch(() => {});
  }, [storageKey, state]);

  return [state, setState] as const;
}
