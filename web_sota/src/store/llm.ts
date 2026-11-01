import { create } from "zustand";

function readStored(key: string, fallback: string): string {
  try {
    return localStorage.getItem(key) || fallback;
  } catch {
    return fallback;
  }
}

function writeStored(key: string, value: string): void {
  try {
    localStorage.setItem(key, value);
  } catch {
    // storage unavailable (private mode) - keep in-memory state only
  }
}

interface LlmState {
  provider: string;
  model: string;
  gpuDetected: boolean;
  setProvider: (provider: string) => void;
  setModel: (model: string) => void;
  setGpuDetected: (detected: boolean) => void;
}

export const useLlmStore = create<LlmState>()((set) => ({
  provider: readStored("llm_provider", "ollama"),
  model: readStored("llm_model", ""),
  gpuDetected: false,
  setProvider: (provider) =>
    set(() => {
      writeStored("llm_provider", provider);
      return { provider };
    }),
  setModel: (model) =>
    set(() => {
      writeStored("llm_model", model);
      return { model };
    }),
  setGpuDetected: (gpuDetected) => set(() => ({ gpuDetected })),
}));
