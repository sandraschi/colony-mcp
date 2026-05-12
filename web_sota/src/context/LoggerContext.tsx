import { createContext, useContext, useState, useCallback, type ReactNode } from "react";

export interface LogEntry {
  ts: string;
  message: string;
  type: "info" | "error" | "success";
}

interface LoggerContextValue {
  entries: LogEntry[];
  log: (message: string, type?: LogEntry["type"]) => void;
  clear: () => void;
  paused: boolean;
  togglePause: () => void;
}

const LoggerContext = createContext<LoggerContextValue | null>(null);

export function LoggerProvider({ children }: { children: ReactNode }) {
  const [entries, setEntries] = useState<LogEntry[]>([]);
  const [paused, setPaused] = useState(false);

  const log = useCallback((message: string, type: LogEntry["type"] = "info") => {
    if (paused) return;
    const entry: LogEntry = {
      ts: new Date().toISOString(),
      message,
      type,
    };
    setEntries((prev) => [entry, ...prev].slice(0, 200));
  }, [paused]);

  const clear = useCallback(() => setEntries([]), []);
  const togglePause = useCallback(() => setPaused((p) => !p), []);

  return (
    <LoggerContext.Provider value={{ entries, log, clear, paused, togglePause }}>
      {children}
    </LoggerContext.Provider>
  );
}

export function useLogger() {
  const ctx = useContext(LoggerContext);
  if (!ctx) throw new Error("useLogger must be used within LoggerProvider");
  return ctx;
}
