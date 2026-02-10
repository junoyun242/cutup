export interface MarkovOptions {
  order: number; // 1-4, higher = more coherent
  count: number; // number of sentences to generate
  maxWords: number; // max words per sentence
}

const buildChain = (text: string, order: number): Map<string, string[]> => {
  const words = text.split(/\s+/).filter((w) => w.length > 0);
  const chain = new Map<string, string[]>();

  for (let i = 0; i <= words.length - order; i++) {
    const key = words.slice(i, i + order).join(" ");
    const next = words[i + order];
    if (next !== undefined) {
      const existing = chain.get(key) || [];
      existing.push(next);
      chain.set(key, existing);
    }
  }

  return chain;
};

const generateSentence = (
  chain: Map<string, string[]>,
  order: number,
  maxWords: number,
): string => {
  const keys = Array.from(chain.keys());
  if (keys.length === 0) return "";

  let current = keys[Math.floor(Math.random() * keys.length)];
  const result = current.split(" ");

  for (let i = 0; i < maxWords - order; i++) {
    const nextWords = chain.get(current);
    if (!nextWords || nextWords.length === 0) break;

    const next = nextWords[Math.floor(Math.random() * nextWords.length)];
    result.push(next);

    // Shift key window
    const keyWords = current.split(" ");
    keyWords.shift();
    keyWords.push(next);
    current = keyWords.join(" ");

    // Sometimes stop at sentence-ending punctuation
    if (/[.!?]$/.test(next) && Math.random() > 0.3) break;
  }

  return result.join(" ");
};

export const generateMarkov = (
  text: string,
  options: MarkovOptions,
): string => {
  const { order, count, maxWords } = options;
  const chain = buildChain(text, order);

  if (chain.size === 0) return "";

  const sentences: string[] = [];
  for (let i = 0; i < count; i++) {
    const sentence = generateSentence(chain, order, maxWords);
    if (sentence) sentences.push(sentence);
  }

  return sentences.join("\n");
};
