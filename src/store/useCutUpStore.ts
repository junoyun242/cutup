import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { HistoryEntry, ExportData, Technique } from "../types/cutup";
import { DEFAULT_SYSTEM_PROMPT, LLM_MODELS } from "../types/cutup";
import {
  performCutUp,
  performFoldIn,
  performPermutation,
} from "../utils/cutUpEngine";

const MAX_HISTORY = 50;

let llmWorker: Worker | null = null;

const getLLMWorker = (onMessage: (e: MessageEvent) => void) => {
  if (!llmWorker) {
    llmWorker = new Worker(new URL("../utils/llm.worker.ts", import.meta.url), {
      type: "module",
    });
  }
  llmWorker.onmessage = onMessage;
  return llmWorker;
};

export type RefineStatus = "idle" | "downloading" | "generating" | "error";

interface CutUpStore {
  // Input
  inputText: string;
  setInputText: (text: string) => void;
  secondInputText: string;
  setSecondInputText: (text: string) => void;

  // Technique
  technique: Technique;
  setTechnique: (technique: Technique) => void;

  // Controls
  fragmentSize: number;
  setFragmentSize: (size: number) => void;
  chaosLevel: number;
  setChaosLevel: (level: number) => void;
  foldPosition: number;
  setFoldPosition: (position: number) => void;
  lineWidth: number;
  setLineWidth: (width: number) => void;

  // Output
  outputText: string;
  isProcessing: boolean;

  // Refine (LLM)
  llmModelId: string;
  setLLMModelId: (id: string) => void;
  systemPrompt: string;
  setSystemPrompt: (prompt: string) => void;
  refinedText: string;
  refineStreamText: string;
  refineStatus: RefineStatus;
  refineProgress: number;
  refineError: string;
  refine: () => void;
  abortRefine: () => void;

  // Actions
  cut: () => void;
  reCut: () => void;
  useOutputAsInput: () => void;
  copyOutput: () => Promise<void>;

  // History
  history: HistoryEntry[];
  addToHistory: () => void;
  deleteHistoryEntry: (id: string) => void;
  clearHistory: () => void;
  loadFromHistory: (entry: HistoryEntry) => void;
  exportHistory: () => void;
  importHistory: (json: string) => boolean;
}

export const useCutUpStore = create<CutUpStore>()(
  persist(
    (set, get) => ({
      inputText: "",
      setInputText: (text) => set({ inputText: text }),
      secondInputText: "",
      setSecondInputText: (text) => set({ secondInputText: text }),

      technique: "cutup" as Technique,
      setTechnique: (technique) => set({ technique }),

      fragmentSize: 2,
      setFragmentSize: (size) => set({ fragmentSize: size }),
      chaosLevel: 5,
      setChaosLevel: (level) => set({ chaosLevel: level }),
      foldPosition: 50,
      setFoldPosition: (position) => set({ foldPosition: position }),
      lineWidth: 60,
      setLineWidth: (width) => set({ lineWidth: width }),

      outputText: "",
      isProcessing: false,

      llmModelId: LLM_MODELS[0].id,
      setLLMModelId: (id) => set({ llmModelId: id }),
      systemPrompt: DEFAULT_SYSTEM_PROMPT,
      setSystemPrompt: (prompt) => set({ systemPrompt: prompt }),
      refinedText: "",
      refineStreamText: "",
      refineStatus: "idle" as RefineStatus,
      refineProgress: 0,
      refineError: "",

      refine: () => {
        const { outputText, refineStatus, llmModelId, systemPrompt } = get();
        if (
          !outputText ||
          refineStatus === "downloading" ||
          refineStatus === "generating"
        )
          return;

        set({
          refinedText: "",
          refineStreamText: "",
          refineError: "",
          refineProgress: 0,
        });

        const worker = getLLMWorker((e: MessageEvent) => {
          const { type } = e.data;
          if (type === "status") {
            set({ refineStatus: e.data.status as RefineStatus });
          } else if (type === "download-progress") {
            set({ refineProgress: e.data.progress });
          } else if (type === "stream") {
            set((state) => ({
              refineStreamText: state.refineStreamText + e.data.token,
            }));
          } else if (type === "complete") {
            set({
              refinedText: e.data.text,
              refineStreamText: "",
              refineStatus: "idle",
            });
          } else if (type === "aborted") {
            set({ refineStatus: "idle", refineStreamText: "" });
          } else if (type === "model-info") {
            // Informational — could show dtype/device in UI
          } else if (type === "error") {
            set({ refineStatus: "error", refineError: e.data.error });
          }
        });

        worker.postMessage({
          type: "refine",
          text: outputText,
          modelId: llmModelId,
          systemPrompt,
        });
      },

      abortRefine: () => {
        if (llmWorker) {
          llmWorker.postMessage({ type: "abort" });
        }
        set({ refineStatus: "idle", refineStreamText: "" });
      },

      cut: () => {
        const {
          inputText,
          secondInputText,
          technique,
          fragmentSize,
          chaosLevel,
          foldPosition,
          lineWidth,
        } = get();
        if (!inputText.trim()) return;
        if (technique === "foldin" && !secondInputText.trim()) return;
        set({
          isProcessing: true,
          refinedText: "",
          refineStreamText: "",
          refineStatus: "idle" as RefineStatus,
        });
        setTimeout(
          () => {
            let resultText: string;
            if (technique === "cutup") {
              const texts = [inputText];
              if (secondInputText.trim()) texts.push(secondInputText);
              const result = performCutUp(texts, { fragmentSize, chaosLevel });
              resultText = result.text;
            } else if (technique === "foldin") {
              const result = performFoldIn(inputText, secondInputText, {
                foldPosition,
                lineWidth,
              });
              resultText = result.text;
            } else {
              const result = performPermutation(inputText);
              resultText = result.text;
            }
            set({ outputText: resultText, isProcessing: false });
            get().addToHistory();
          },
          200 + Math.random() * 300,
        );
      },

      reCut: () => {
        const { inputText } = get();
        if (!inputText.trim()) return;
        get().cut();
      },

      useOutputAsInput: () => {
        const { outputText } = get();
        if (!outputText) return;
        set({
          inputText: outputText,
          outputText: "",
          refinedText: "",
          refineStreamText: "",
        });
      },

      copyOutput: async () => {
        const { outputText } = get();
        if (!outputText) return;
        await navigator.clipboard.writeText(outputText);
      },

      history: [],

      addToHistory: () => {
        const {
          inputText,
          secondInputText,
          outputText,
          technique,
          fragmentSize,
          chaosLevel,
          foldPosition,
          lineWidth,
          history,
        } = get();
        if (!outputText) return;
        const entry: HistoryEntry = {
          id: crypto.randomUUID(),
          timestamp: Date.now(),
          inputText,
          ...(technique !== "permutation" && secondInputText.trim()
            ? { secondInputText }
            : {}),
          outputText,
          technique,
          fragmentSize,
          chaosLevel,
          ...(technique === "foldin" ? { foldPosition, lineWidth } : {}),
        };
        set({ history: [entry, ...history].slice(0, MAX_HISTORY) });
      },

      deleteHistoryEntry: (id) => {
        set({ history: get().history.filter((e) => e.id !== id) });
      },

      clearHistory: () => set({ history: [] }),

      loadFromHistory: (entry) => {
        set({
          inputText: entry.inputText,
          secondInputText: entry.secondInputText ?? "",
          outputText: entry.outputText,
          technique: entry.technique ?? "cutup",
          fragmentSize: entry.fragmentSize,
          chaosLevel: entry.chaosLevel,
          foldPosition: entry.foldPosition ?? 50,
          lineWidth: entry.lineWidth ?? 60,
          refinedText: "",
          refineStreamText: "",
        });
      },

      exportHistory: () => {
        const data: ExportData = {
          version: 1,
          exportedAt: Date.now(),
          entries: get().history,
        };
        const blob = new Blob([JSON.stringify(data, null, 2)], {
          type: "application/json",
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `cutup-history-${new Date().toISOString().slice(0, 10)}.json`;
        a.click();
        URL.revokeObjectURL(url);
      },

      importHistory: (json) => {
        try {
          const data: ExportData = JSON.parse(json);
          if (data.version !== 1 || !Array.isArray(data.entries)) return false;
          const { history } = get();
          const existingIds = new Set(history.map((e) => e.id));
          const newEntries = data.entries.filter((e) => !existingIds.has(e.id));
          set({ history: [...newEntries, ...history].slice(0, MAX_HISTORY) });
          return true;
        } catch {
          return false;
        }
      },
    }),
    {
      name: "cutup-machine",
      partialize: (state) => ({
        history: state.history,
        technique: state.technique,
        fragmentSize: state.fragmentSize,
        chaosLevel: state.chaosLevel,
        foldPosition: state.foldPosition,
        lineWidth: state.lineWidth,
        llmModelId: state.llmModelId,
        systemPrompt: state.systemPrompt,
      }),
    },
  ),
);
