export type Technique = 'cutup' | 'foldin' | 'permutation' | 'lineshuffle' | 'erasure';

export interface HistoryEntry {
  id: string;
  timestamp: number;
  inputText: string;
  secondInputText?: string;
  outputText: string;
  technique: Technique;
  fragmentSize: number;
  chaosLevel: number;
  foldPosition?: number;
  lineWidth?: number;
  label?: string;
}

export interface CutUpOptions {
  fragmentSize: number;
  chaosLevel: number;
}

export interface FoldInOptions {
  foldPosition: number;
  lineWidth: number;
}

export interface CutUpResult {
  text: string;
  fragments: string[];
}

export interface FoldInResult {
  text: string;
  lines: string[];
}

export interface PermutationResult {
  text: string;
  lines: string[];
  totalPermutations: number;
}

export interface ExportData {
  version: 1;
  exportedAt: number;
  entries: HistoryEntry[];
}

export interface LLMModelOption {
  id: string;
  label: string;
  size: string;
}

export const LLM_MODELS: LLMModelOption[] = [
  { id: "onnx-community/Qwen2.5-0.5B-Instruct", label: "Qwen 2.5 0.5B", size: "~350MB" },
  { id: "onnx-community/Qwen2.5-1.5B-Instruct", label: "Qwen 2.5 1.5B", size: "~1GB" },
];

export const DEFAULT_SYSTEM_PROMPT =
  "You are a literary editor working with experimental cut-up texts. " +
  "Rewrite the following text fragments into poetic, grammatically coherent sentences. " +
  "Preserve the surreal imagery and unexpected juxtapositions. " +
  "Do not explain or comment. Output only the rewritten text.";
