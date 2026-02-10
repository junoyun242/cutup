import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { HistoryEntry, ExportData, Technique } from "../types/cutup";
import {
  performCutUp,
  performFoldIn,
  performLineShuffle,
  performPermutation,
} from "../utils/cutUpEngine";
import { generateMarkov } from "../utils/markov";
import { generatePOSMarkov } from "../utils/posMarkov";
import { breakBySyllables } from "../utils/syllable";

const MAX_HISTORY = 50;

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
  targetSyllables: number;
  setTargetSyllables: (count: number) => void;

  // Output
  outputText: string;
  isProcessing: boolean;

  // Erasure
  erasureLines: string[][];
  erasureSelected: boolean[][];
  toggleErasureWord: (lineIndex: number, wordIndex: number) => void;
  getErasureText: () => string;

  // Output tools
  showSyllables: boolean;
  toggleSyllables: () => void;
  filterWord: string;
  setFilterWord: (word: string) => void;
  showPosFilter: boolean;
  toggleShowPosFilter: () => void;
  posFilterTags: string[];
  togglePosFilterTag: (tag: string) => void;

  // Markov refine
  markovMode: "word" | "pos";
  setMarkovMode: (mode: "word" | "pos") => void;
  markovOrder: number;
  setMarkovOrder: (order: number) => void;
  markovCount: number;
  setMarkovCount: (count: number) => void;
  refinedText: string;
  refine: () => void;

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
      setTechnique: (technique) =>
        set({ technique, erasureLines: [], erasureSelected: [] }),

      fragmentSize: 2,
      setFragmentSize: (size) => set({ fragmentSize: size }),
      chaosLevel: 5,
      setChaosLevel: (level) => set({ chaosLevel: level }),
      foldPosition: 50,
      setFoldPosition: (position) => set({ foldPosition: position }),
      lineWidth: 60,
      setLineWidth: (width) => set({ lineWidth: width }),
      targetSyllables: 0,
      setTargetSyllables: (count) => set({ targetSyllables: count }),

      outputText: "",
      isProcessing: false,

      // Erasure
      erasureLines: [],
      erasureSelected: [],
      toggleErasureWord: (lineIndex, wordIndex) => {
        set((state) => {
          const newSelected = state.erasureSelected.map((line) => [...line]);
          if (newSelected[lineIndex]) {
            newSelected[lineIndex][wordIndex] =
              !newSelected[lineIndex][wordIndex];
          }
          return { erasureSelected: newSelected };
        });
      },
      getErasureText: () => {
        const { erasureLines, erasureSelected } = get();
        return erasureLines
          .map((line, i) =>
            line.filter((_, j) => erasureSelected[i]?.[j]).join(" "),
          )
          .filter((l) => l)
          .join("\n");
      },

      // Output tools
      showSyllables: false,
      toggleSyllables: () =>
        set((state) => ({ showSyllables: !state.showSyllables })),
      filterWord: "",
      setFilterWord: (word) => set({ filterWord: word }),
      showPosFilter: false,
      toggleShowPosFilter: () =>
        set((state) => ({ showPosFilter: !state.showPosFilter })),
      posFilterTags: [] as string[],
      togglePosFilterTag: (tag) =>
        set((state) => ({
          posFilterTags: state.posFilterTags.includes(tag)
            ? state.posFilterTags.filter((t) => t !== tag)
            : [...state.posFilterTags, tag],
        })),

      // Markov
      markovMode: "pos" as "word" | "pos",
      setMarkovMode: (mode) => set({ markovMode: mode }),
      markovOrder: 2,
      setMarkovOrder: (order) => set({ markovOrder: order }),
      markovCount: 5,
      setMarkovCount: (count) => set({ markovCount: count }),
      refinedText: "",

      refine: () => {
        const { inputText, secondInputText, markovMode, markovOrder, markovCount, targetSyllables } = get();
        const source = [inputText, secondInputText]
          .filter((t) => t.trim())
          .join(" ");
        if (!source.trim()) return;

        let result = markovMode === "pos"
          ? generatePOSMarkov(source, { order: markovOrder, count: markovCount, maxWords: 30 })
          : generateMarkov(source, {
          order: markovOrder,
          count: markovCount,
          maxWords: 30,
        });
        if (targetSyllables > 0) {
          result = breakBySyllables(result, targetSyllables);
        }
        set({ refinedText: result });
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
          targetSyllables,
        } = get();
        if (!inputText.trim()) return;
        if (technique === "foldin" && !secondInputText.trim()) return;

        // Erasure: parse words into grid, no processing delay
        if (technique === "erasure") {
          const lines = inputText
            .split("\n")
            .filter((l) => l.trim())
            .map((l) => l.split(/\s+/).filter(Boolean));
          const selected = lines.map((line) => line.map(() => false));
          set({
            erasureLines: lines,
            erasureSelected: selected,
            outputText: "",
            refinedText: "",
          });
          return;
        }

        set({
          isProcessing: true,
          refinedText: "",
          erasureLines: [],
          erasureSelected: [],
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
            } else if (technique === "lineshuffle") {
              const result = performLineShuffle(inputText);
              resultText = result.text;
            } else {
              const result = performPermutation(inputText);
              resultText = result.text;
            }
            if (targetSyllables > 0 && (technique === "cutup" || technique === "permutation")) {
              resultText = breakBySyllables(resultText, targetSyllables);
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
        const { outputText, technique } = get();
        // For erasure, use the selected words
        const text =
          technique === "erasure" ? get().getErasureText() : outputText;
        if (!text) return;
        set({
          inputText: text,
          outputText: "",
          refinedText: "",
          erasureLines: [],
          erasureSelected: [],
        });
      },

      copyOutput: async () => {
        const { outputText, technique } = get();
        const text =
          technique === "erasure" ? get().getErasureText() : outputText;
        if (!text) return;
        await navigator.clipboard.writeText(text);
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
          ...(technique !== "permutation" &&
          technique !== "lineshuffle" &&
          technique !== "erasure" &&
          secondInputText.trim()
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
          erasureLines: [],
          erasureSelected: [],
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
        markovMode: state.markovMode,
        markovOrder: state.markovOrder,
        markovCount: state.markovCount,
        showSyllables: state.showSyllables,
        targetSyllables: state.targetSyllables,
      }),
    },
  ),
);
