import nlp from "compromise";

// Map compromise tags to simplified POS categories
export const POS_CATEGORIES = [
  { key: "NOU", label: "Noun", compromiseTag: "Noun" },
  { key: "VRB", label: "Verb", compromiseTag: "Verb" },
  { key: "ADJ", label: "Adj", compromiseTag: "Adjective" },
  { key: "ADV", label: "Adv", compromiseTag: "Adverb" },
  { key: "PRO", label: "Pro", compromiseTag: "Pronoun" },
  { key: "PRP", label: "Prep", compromiseTag: "Preposition" },
  { key: "DET", label: "Det", compromiseTag: "Determiner" },
  { key: "CNJ", label: "Conj", compromiseTag: "Conjunction" },
] as const;

const POS_PRIORITY: [string, string][] = POS_CATEGORIES.map((c) => [
  c.compromiseTag,
  c.key,
]);

const START = "__START__";

export const getPrimaryPOS = (tags: string[]): string => {
  for (const [tag, pos] of POS_PRIORITY) {
    if (tags.includes(tag)) return pos;
  }
  return "OTH";
};

export interface TaggedWord {
  text: string;
  pos: string;
}

/** Tag each word in a text with its primary POS */
export const tagWords = (text: string): TaggedWord[] => {
  const doc = nlp(text);
  const result: TaggedWord[] = [];
  const data = doc.json();

  for (const sentence of data) {
    for (const term of sentence.terms || []) {
      const tags: string[] = Array.isArray(term.tags)
        ? term.tags
        : term.tags instanceof Set
          ? Array.from(term.tags)
          : [];
      if (tags.includes("Punctuation") && !/[a-zA-Z]/.test(term.text)) continue;
      result.push({
        text: term.text,
        pos: getPrimaryPOS(tags),
      });
    }
  }

  return result;
};

const tagSentences = (text: string): TaggedWord[][] => {
  const doc = nlp(text);
  const result: TaggedWord[][] = [];
  const data = doc.json();

  for (const sentence of data) {
    const words: TaggedWord[] = [];
    for (const term of sentence.terms || []) {
      // compromise json() returns tags as array
      const tags: string[] = Array.isArray(term.tags)
        ? term.tags
        : term.tags instanceof Set
          ? Array.from(term.tags)
          : [];
      // Skip pure punctuation
      if (tags.includes("Punctuation") && !/[a-zA-Z]/.test(term.text)) continue;
      words.push({
        text: term.text,
        pos: getPrimaryPOS(tags),
      });
    }
    if (words.length > 0) result.push(words);
  }

  return result;
};

export interface POSMarkovOptions {
  order: number;
  count: number;
  maxWords: number;
}

const pickRandom = <T>(arr: T[]): T =>
  arr[Math.floor(Math.random() * arr.length)];

export const generatePOSMarkov = (
  text: string,
  options: POSMarkovOptions,
): string => {
  const { order, count, maxWords } = options;
  const sentences = tagSentences(text);

  if (sentences.length === 0) return "";

  // Build POS Markov chain + word buckets
  const posChain = new Map<string, string[]>();
  const wordBuckets = new Map<string, Set<string>>();

  for (const sentence of sentences) {
    // Collect words into POS buckets
    for (const w of sentence) {
      if (!wordBuckets.has(w.pos)) wordBuckets.set(w.pos, new Set());
      wordBuckets.get(w.pos)!.add(w.text);
    }

    // Build POS chain with START padding
    const posSeq = sentence.map((w) => w.pos);
    const padded = [...Array(order).fill(START), ...posSeq];

    for (let i = order; i < padded.length; i++) {
      const key = padded.slice(i - order, i).join(" ");
      const next = padded[i];
      if (!posChain.has(key)) posChain.set(key, []);
      posChain.get(key)!.push(next);
    }
  }

  if (posChain.size === 0) return "";

  // Convert Sets to arrays for random picking
  const bucketArrays = new Map<string, string[]>();
  for (const [pos, words] of wordBuckets) {
    bucketArrays.set(pos, Array.from(words));
  }

  // Generate sentences
  const results: string[] = [];

  for (let s = 0; s < count; s++) {
    const startKey = Array(order).fill(START).join(" ");
    let currentKey = startKey;
    const words: string[] = [];

    for (let i = 0; i < maxWords; i++) {
      const nextOptions = posChain.get(currentKey);
      if (!nextOptions || nextOptions.length === 0) break;

      const nextPOS = pickRandom(nextOptions);
      const bucket = bucketArrays.get(nextPOS);
      if (!bucket || bucket.length === 0) break;

      words.push(pickRandom(bucket));

      // Shift key window
      const keyParts = currentKey.split(" ");
      keyParts.shift();
      keyParts.push(nextPOS);
      currentKey = keyParts.join(" ");
    }

    if (words.length > 0) results.push(words.join(" "));
  }

  return results.join("\n");
};
