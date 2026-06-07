import { useCallback, useEffect, useState } from "react";

export type VerseStatus = "not-started" | "practicing" | "mastered";

export interface Settings {
  fontSize: number; // px for arabic
  reciter: string;
  showTranslation: boolean;
  showTransliteration: boolean;
  chunkSize: number;
}

export interface ProgressState {
  statuses: Record<number, VerseStatus>;
  lastVerse: number;
  settings: Settings;
}

const DEFAULT: ProgressState = {
  statuses: {},
  lastVerse: 1,
  settings: {
    fontSize: 32,
    reciter: "ar.alafasy",
    showTranslation: true,
    showTransliteration: false,
    chunkSize: 5,
  },
};

const KEY = "noor.yaseen.v1";

export function useProgress() {
  const [state, setState] = useState<ProgressState>(DEFAULT);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<ProgressState>;
        setState({
          ...DEFAULT,
          ...parsed,
          settings: { ...DEFAULT.settings, ...(parsed.settings ?? {}) },
          statuses: parsed.statuses ?? {},
        });
      }
    } catch {
      /* ignore */
    }
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (!loaded) return;
    localStorage.setItem(KEY, JSON.stringify(state));
  }, [state, loaded]);

  const setStatus = useCallback((verse: number, status: VerseStatus) => {
    setState((s) => ({ ...s, statuses: { ...s.statuses, [verse]: status } }));
  }, []);

  const setLastVerse = useCallback((verse: number) => {
    setState((s) => (s.lastVerse === verse ? s : { ...s, lastVerse: verse }));
  }, []);

  const updateSettings = useCallback((patch: Partial<Settings>) => {
    setState((s) => ({ ...s, settings: { ...s.settings, ...patch } }));
  }, []);

  const reset = useCallback(() => {
    setState({ ...DEFAULT, settings: state.settings });
  }, [state.settings]);

  return { state, setStatus, setLastVerse, updateSettings, reset, loaded };
}