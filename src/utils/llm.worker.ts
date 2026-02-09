import {
  AutoTokenizer,
  AutoModelForCausalLM,
  TextStreamer,
  env,
} from "@huggingface/transformers";

env.allowLocalModels = false;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let tokenizer: any = null;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let model: any = null;
let currentModelId: string | null = null;
let aborted = false;

const hasWebGPU = () => "gpu" in navigator;

// Prefer higher-quality quantizations first; fall back to more compressed ones
type Dtype = "q4f16" | "fp16" | "q4" | "q8" | "fp32";
const DTYPE_ORDER_WEBGPU: Dtype[] = ["q4f16", "fp16", "q4"];
const DTYPE_ORDER_WASM: Dtype[] = ["q8", "q4"];

const loadModel = async (modelId: string) => {
  if (model && tokenizer && currentModelId === modelId) return;

  // Dispose previous model
  if (model) {
    try { await model.dispose?.(); } catch { /* ignore */ }
    model = null;
    tokenizer = null;
    currentModelId = null;
  }

  self.postMessage({ type: "status", status: "downloading" });

  // Load tokenizer first (small, unlikely to fail)
  tokenizer = await AutoTokenizer.from_pretrained(modelId);

  const device = hasWebGPU() ? "webgpu" : "wasm";
  const dtypes = device === "webgpu" ? DTYPE_ORDER_WEBGPU : DTYPE_ORDER_WASM;

  let lastError: unknown = null;

  for (const dtype of dtypes) {
    try {
      model = await AutoModelForCausalLM.from_pretrained(modelId, {
        device,
        dtype,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        progress_callback: (info: any) => {
          if (info.status === "progress" && info.progress != null) {
            self.postMessage({
              type: "download-progress",
              progress: Math.round(info.progress),
            });
          }
        },
      });
      currentModelId = modelId;
      self.postMessage({ type: "model-info", modelId, dtype, device });
      return;
    } catch (e) {
      lastError = e;
      // Try next dtype
    }
  }

  throw lastError || new Error(`No compatible quantization found for ${modelId}`);
};

const MAX_INPUT_CHARS = 800;

self.onmessage = async (e: MessageEvent) => {
  if (e.data.type === "abort") {
    aborted = true;
    return;
  }

  if (e.data.type !== "refine") return;

  aborted = false;
  const { text, modelId, systemPrompt } = e.data;

  try {
    await loadModel(modelId);

    if (aborted) {
      self.postMessage({ type: "aborted" });
      return;
    }

    self.postMessage({ type: "status", status: "generating" });

    const truncated =
      text.length > MAX_INPUT_CHARS
        ? text.slice(0, MAX_INPUT_CHARS) + "..."
        : text;

    const messages = [
      { role: "system", content: systemPrompt },
      { role: "user", content: truncated },
    ];

    // Explicitly apply chat template → text → tokenize
    // This avoids any ambiguity the pipeline might have
    const chatText = tokenizer.apply_chat_template(messages, {
      tokenize: false,
      add_generation_prompt: true,
    });

    const inputs = tokenizer(chatText);

    let accumulated = "";

    const streamer = new TextStreamer(tokenizer, {
      skip_prompt: true,
      skip_special_tokens: true,
      callback_function: (token: string) => {
        if (!aborted) {
          accumulated += token;
          self.postMessage({ type: "stream", token });
        }
      },
    });

    await model.generate({
      ...inputs,
      max_new_tokens: 512,
      temperature: 0.7,
      do_sample: true,
      top_p: 0.9,
      repetition_penalty: 1.2,
      streamer,
      callback_function: () => {
        if (aborted) throw new Error("ABORTED");
      },
    });

    if (aborted) {
      self.postMessage({ type: "aborted" });
      return;
    }

    self.postMessage({ type: "complete", text: accumulated.trim() });
  } catch (err) {
    if (aborted) {
      self.postMessage({ type: "aborted" });
    } else {
      self.postMessage({ type: "error", error: String(err) });
    }
  }
};
