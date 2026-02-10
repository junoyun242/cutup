export const countSyllables = (word: string): number => {
  let w = word.toLowerCase().replace(/[^a-z]/g, "");
  if (!w) return 0;
  if (w.length <= 2) return 1;

  const originalW = w;

  w = w.replace(/(?:[^leascx]|(?:[^s]ch)|(?:[^s]sh))es$/, "");
  w = w.replace(/(?:[^td])ed$/, "");
  w = w.replace(/([^laeiouy])e$/, "$1");

  w = w.replace(/^y/, "");

  const matches = w.match(/[aeiouy]+/g);
  let count = matches ? matches.length : 0;

  if (
    originalW.endsWith("le") &&
    originalW.length > 2 &&
    !/[aeiouy]le$/.test(originalW)
  ) {
    count++;
  }

  return Math.max(1, count);
};

export const countLineSyllables = (line: string): number =>
  line
    .split(/\s+/)
    .filter(Boolean)
    .reduce((sum, word) => sum + countSyllables(word), 0);

export const breakBySyllables = (text: string, target: number): string => {
  const words = text.replace(/\n/g, " ").split(/\s+/).filter(Boolean);
  if (words.length === 0 || target <= 0) return text;

  const lines: string[] = [];
  let currentLine: string[] = [];
  let currentCount = 0;

  for (const word of words) {
    const syl = countSyllables(word);
    if (currentLine.length > 0 && currentCount + syl > target) {
      const without = Math.abs(currentCount - target);
      const withWord = Math.abs(currentCount + syl - target);
      if (without <= withWord) {
        lines.push(currentLine.join(" "));
        currentLine = [word];
        currentCount = syl;
      } else {
        currentLine.push(word);
        currentCount += syl;
        lines.push(currentLine.join(" "));
        currentLine = [];
        currentCount = 0;
      }
    } else {
      currentLine.push(word);
      currentCount += syl;
    }
  }
  if (currentLine.length > 0) {
    lines.push(currentLine.join(" "));
  }

  return lines.join("\n");
};
