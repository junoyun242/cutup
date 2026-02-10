import type { CutUpOptions, CutUpResult, FoldInOptions, FoldInResult, PermutationResult } from '../types/cutup';

const shuffle = <T,>(array: T[], passes: number = 1): T[] => {
  const result = [...array];
  for (let p = 0; p < passes; p++) {
    for (let i = result.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [result[i], result[j]] = [result[j], result[i]];
    }
  }
  return result;
};

const fragmentize = (text: string, fragmentSize: number): string[] => {
  const words = text.split(/\s+/).filter(Boolean);
  const fragments: string[] = [];
  for (let i = 0; i < words.length; i += fragmentSize) {
    fragments.push(words.slice(i, i + fragmentSize).join(' '));
  }
  return fragments;
};

export const performCutUp = (texts: string[], options: CutUpOptions): CutUpResult => {
  const combined = texts.filter((t) => t.trim()).join(' ');
  if (!combined.trim()) {
    return { text: '', fragments: [] };
  }
  const fragments = fragmentize(combined, options.fragmentSize);
  const shuffled = shuffle(fragments, options.chaosLevel);

  // Group fragments into lines (~8-12 words each) so syllable counter & filter work
  const lines: string[] = [];
  let currentLine: string[] = [];
  let wordCount = 0;
  const wordsPerLine = Math.max(6, Math.min(12, Math.round(8 + options.chaosLevel * 0.5)));

  for (const fragment of shuffled) {
    const fragWords = fragment.split(/\s+/).length;
    currentLine.push(fragment);
    wordCount += fragWords;
    if (wordCount >= wordsPerLine) {
      lines.push(currentLine.join(' '));
      currentLine = [];
      wordCount = 0;
    }
  }
  if (currentLine.length > 0) {
    lines.push(currentLine.join(' '));
  }

  return {
    text: lines.join('\n'),
    fragments: shuffled,
  };
};

const wordWrap = (text: string, width: number): string[] => {
  const lines: string[] = [];
  for (const paragraph of text.split('\n')) {
    const words = paragraph.split(/\s+/).filter(Boolean);
    if (words.length === 0) {
      lines.push('');
      continue;
    }
    let current = words[0];
    for (let i = 1; i < words.length; i++) {
      if (current.length + 1 + words[i].length <= width) {
        current += ' ' + words[i];
      } else {
        lines.push(current);
        current = words[i];
      }
    }
    lines.push(current);
  }
  return lines;
};

export const performFoldIn = (textA: string, textB: string, options: FoldInOptions): FoldInResult => {
  if (!textA.trim() && !textB.trim()) {
    return { text: '', lines: [] };
  }

  const pageWidth = options.lineWidth;
  const linesA = wordWrap(textA, pageWidth);
  const linesB = wordWrap(textB, pageWidth);
  const maxLines = Math.max(linesA.length, linesB.length);
  const foldColumn = Math.round(pageWidth * (options.foldPosition / 100));

  const resultLines: string[] = [];

  for (let i = 0; i < maxLines; i++) {
    const lineA = (linesA[i] ?? '').padEnd(pageWidth);
    const lineB = (linesB[i] ?? '').padEnd(pageWidth);
    const leftA = lineA.slice(0, foldColumn);
    const rightB = lineB.slice(foldColumn);
    resultLines.push((leftA + rightB).trimEnd());
  }

  return {
    text: resultLines.join('\n'),
    lines: resultLines,
  };
};

export const performLineShuffle = (text: string): { text: string; lines: string[] } => {
  const lines = text.split('\n').filter((l) => l.trim());
  if (lines.length === 0) return { text: '', lines: [] };
  const shuffled = shuffle(lines);
  return { text: shuffled.join('\n'), lines: shuffled };
};

const MAX_FULL_PERMUTATION_WORDS = 7;
const MAX_SAMPLED_LINES = 200;

const permute = (words: string[]): string[][] => {
  if (words.length <= 1) return [words];
  const result: string[][] = [];
  for (let i = 0; i < words.length; i++) {
    const rest = [...words.slice(0, i), ...words.slice(i + 1)];
    for (const perm of permute(rest)) {
      result.push([words[i], ...perm]);
    }
  }
  return result;
};

export const performPermutation = (text: string): PermutationResult => {
  const words = text.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) {
    return { text: '', lines: [], totalPermutations: 0 };
  }
  if (words.length === 1) {
    return { text: words[0], lines: [words[0]], totalPermutations: 1 };
  }

  // Calculate total permutations (n!)
  let totalPermutations = 1;
  for (let i = 2; i <= words.length; i++) {
    totalPermutations *= i;
  }

  let lines: string[];

  if (words.length <= MAX_FULL_PERMUTATION_WORDS) {
    // Full permutation for short phrases
    lines = permute(words).map((perm) => perm.join(' '));
  } else {
    // Random sample for longer phrases
    const seen = new Set<string>();
    while (seen.size < MAX_SAMPLED_LINES) {
      const shuffled = shuffle([...words]);
      seen.add(shuffled.join(' '));
    }
    lines = [...seen];
  }

  return {
    text: lines.join('\n'),
    lines,
    totalPermutations,
  };
};
