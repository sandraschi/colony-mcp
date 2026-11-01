import { useCallback, useEffect, useState } from "react";

const LEVELS = [0.5, 0.6, 0.7, 0.8, 1.0, 1.25, 1.5, 2.0, 3.0];
const STORAGE_KEY = "tauri-zoom";

function clampIndex(i: number): number {
  if (i < 0) return 0;
  if (i >= LEVELS.length) return LEVELS.length - 1;
  return i;
}

function initialIndex(): number {
  try {
    const saved = parseFloat(localStorage.getItem(STORAGE_KEY) || "");
    const idx = LEVELS.indexOf(saved);
    return idx >= 0 ? idx : LEVELS.indexOf(1.0);
  } catch {
    return LEVELS.indexOf(1.0);
  }
}

function applyZoom(level: number): void {
  try {
    document.documentElement.style.setProperty("zoom", String(level));
  } catch {
    // CSS zoom unsupported here - layout stays at 1.0
  }
}

export function useZoom() {
  const [levelIndex, setLevelIndex] = useState<number>(initialIndex);

  useEffect(() => {
    const level = LEVELS[levelIndex];
    applyZoom(level);
    try {
      localStorage.setItem(STORAGE_KEY, String(level));
    } catch {
      // private mode - keep in-memory only
    }
  }, [levelIndex]);

  const zoomIn = useCallback(() => setLevelIndex((i) => clampIndex(i + 1)), []);
  const zoomOut = useCallback(() => setLevelIndex((i) => clampIndex(i - 1)), []);
  const resetZoom = useCallback(() => setLevelIndex(LEVELS.indexOf(1.0)), []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!(e.ctrlKey || e.metaKey)) return;
      if (e.key === "0") {
        e.preventDefault();
        resetZoom();
      } else if (e.key === "=" || e.key === "+") {
        e.preventDefault();
        zoomIn();
      } else if (e.key === "-") {
        e.preventDefault();
        zoomOut();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [resetZoom, zoomIn, zoomOut]);

  return { zoom: LEVELS[levelIndex], zoomIn, zoomOut, resetZoom };
}
