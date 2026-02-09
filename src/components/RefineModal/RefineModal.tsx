import { useState } from "react";
import {
  Box,
  Button,
  Collapse,
  Flex,
  Modal,
  Progress,
  Select,
  Stack,
  Text,
  Textarea,
  Tooltip,
} from "@mantine/core";
import { useCutUpStore, type RefineStatus } from "../../store/useCutUpStore";
import { DEFAULT_SYSTEM_PROMPT, LLM_MODELS } from "../../types/cutup";
import { T } from "../../theme/tokens";

const modalStyles = {
  header: {
    background: "linear-gradient(to bottom, #2a2a2e, #222226)",
    borderBottom: "1px solid #444",
    padding: "0.6rem 1rem",
  },
  title: {
    fontFamily: T.fontLabel,
    fontSize: "0.7rem",
    letterSpacing: "0.2em",
    color: T.labelText,
  },
  body: {
    background: "#16161a",
    padding: "1rem",
  },
  close: {
    color: T.engravedText,
    "&:hover": { background: "rgba(255,255,255,0.05)" },
  },
  content: {
    background: "#1a1a1e",
    border: "1px solid #333",
    borderRadius: 6,
  },
  overlay: {
    background: "rgba(0,0,0,0.75)",
    backdropFilter: "blur(4px)",
  },
};

const smallLabelStyle = {
  fontFamily: T.fontLabel,
  fontSize: "0.5rem",
  letterSpacing: "0.15em",
  color: T.engravedText,
  textTransform: "uppercase" as const,
};

const buttonBase = {
  fontFamily: T.fontLabel,
  fontSize: "0.6rem",
  letterSpacing: "0.15em",
  textTransform: "uppercase" as const,
  border: "none",
  height: "auto",
  padding: "0.5rem 1rem",
};

interface RefineModalProps {
  opened: boolean;
  onClose: () => void;
}

export const RefineModal = ({ opened, onClose }: RefineModalProps) => {
  const outputText = useCutUpStore((s) => s.outputText);
  const llmModelId = useCutUpStore((s) => s.llmModelId);
  const setLLMModelId = useCutUpStore((s) => s.setLLMModelId);
  const systemPrompt = useCutUpStore((s) => s.systemPrompt);
  const setSystemPrompt = useCutUpStore((s) => s.setSystemPrompt);
  const refinedText = useCutUpStore((s) => s.refinedText);
  const refineStreamText = useCutUpStore((s) => s.refineStreamText);
  const refineStatus = useCutUpStore((s) => s.refineStatus);
  const refineProgress = useCutUpStore((s) => s.refineProgress);
  const refineError = useCutUpStore((s) => s.refineError);
  const refine = useCutUpStore((s) => s.refine);
  const abortRefine = useCutUpStore((s) => s.abortRefine);

  const [promptOpen, setPromptOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const isActive =
    refineStatus === "downloading" || refineStatus === "generating";
  const displayText = refinedText || refineStreamText;

  const statusLabel = (status: RefineStatus, progress: number) => {
    switch (status) {
      case "downloading":
        return `DOWNLOADING MODEL ${progress}%`;
      case "generating":
        return "GENERATING";
      case "error":
        return "ERROR";
      default:
        return "READY";
    }
  };

  const handleCopy = async () => {
    if (!refinedText) return;
    await navigator.clipboard.writeText(refinedText);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const handleUse = () => {
    if (!refinedText) return;
    useCutUpStore.setState({
      inputText: refinedText,
      outputText: "",
      refinedText: "",
      refineStreamText: "",
    });
    onClose();
  };

  const handleClose = () => {
    if (isActive) return;
    onClose();
  };

  const modelData = LLM_MODELS.map((m) => ({
    value: m.id,
    label: `${m.label} (${m.size})`,
  }));

  return (
    <Modal
      opened={opened}
      onClose={handleClose}
      title="AI REFINE"
      centered
      size="lg"
      closeOnClickOutside={!isActive}
      closeOnEscape={!isActive}
      styles={modalStyles}
    >
      <Stack gap="sm">
        {/* Model selector */}
        <Box>
          <Text style={smallLabelStyle} mb={4}>
            MODEL
          </Text>
          <Select
            value={llmModelId}
            onChange={(v) => v && setLLMModelId(v)}
            data={modelData}
            disabled={isActive}
            styles={{
              input: {
                background: "#111114",
                border: "1px solid #333",
                color: T.amberLed,
                fontFamily: T.fontLabel,
                fontSize: "0.65rem",
                letterSpacing: "0.1em",
              },
              dropdown: {
                background: "#1a1a1e",
                border: "1px solid #333",
              },
              option: {
                fontFamily: T.fontLabel,
                fontSize: "0.6rem",
                color: T.labelText,
                "&[data-selected]": { background: "#333", color: T.amberLed },
                "&:hover": { background: "#2a2a2e" },
              },
            }}
          />
        </Box>

        {/* System prompt toggle */}
        <Box>
          <Button
            variant="subtle"
            onClick={() => setPromptOpen((o) => !o)}
            disabled={isActive}
            styles={{
              root: {
                ...smallLabelStyle,
                padding: "0.2rem 0",
                height: "auto",
                color: T.engravedText,
                "&:hover": { background: "transparent", color: T.labelText },
              },
            }}
          >
            {promptOpen ? "▾" : "▸"} SYSTEM PROMPT
          </Button>
          <Collapse in={promptOpen}>
            <Textarea
              value={systemPrompt}
              onChange={(e) => setSystemPrompt(e.currentTarget.value)}
              disabled={isActive}
              minRows={3}
              maxRows={6}
              autosize
              styles={{
                input: {
                  background: "#111114",
                  border: "1px solid #333",
                  color: T.labelText,
                  fontFamily: T.fontLabel,
                  fontSize: "0.6rem",
                  lineHeight: 1.5,
                  resize: "none" as const,
                },
              }}
            />
            <Button
              variant="subtle"
              size="xs"
              mt={4}
              onClick={() => setSystemPrompt(DEFAULT_SYSTEM_PROMPT)}
              disabled={isActive}
              styles={{
                root: {
                  ...smallLabelStyle,
                  fontSize: "0.45rem",
                  padding: "0.1rem 0.4rem",
                  height: "auto",
                  color: T.engravedText,
                  "&:hover": {
                    background: "transparent",
                    color: T.labelText,
                  },
                },
              }}
            >
              RESET TO DEFAULT
            </Button>
          </Collapse>
        </Box>

        {/* Progress bar */}
        {refineStatus === "downloading" && (
          <Box>
            <Progress
              value={refineProgress}
              size="xs"
              styles={{
                root: { background: "#111114" },
                section: {
                  background: `linear-gradient(to right, ${T.amberLed}88, ${T.amberLed})`,
                },
              }}
            />
          </Box>
        )}

        {/* Status indicator */}
        <Flex align="center" gap={6}>
          <Box
            style={{
              width: 6,
              height: 6,
              borderRadius: "50%",
              background: isActive
                ? refineStatus === "generating"
                  ? T.greenLed
                  : T.amberLed
                : refineStatus === "error"
                  ? "#ff4444"
                  : "#333",
              boxShadow: isActive
                ? refineStatus === "generating"
                  ? T.greenGlow
                  : T.amberGlow
                  : "none",
              transition: "all 0.3s ease",
              animation:
                refineStatus === "generating"
                  ? "pulse 1s ease-in-out infinite"
                  : "none",
            }}
          />
          <Text style={{ ...smallLabelStyle, color: isActive ? T.labelText : T.engravedText }}>
            {statusLabel(refineStatus, refineProgress)}
          </Text>
        </Flex>

        {/* Output display */}
        <Box
          style={{
            background: "#050510",
            border: `1px solid ${displayText ? T.amberLed + "33" : "#1a1a1e"}`,
            borderRadius: 2,
            padding: "1rem",
            minHeight: 120,
            maxHeight: 300,
            overflowY: "auto",
            fontFamily: T.fontDisplay,
            fontSize: "1.1rem",
            lineHeight: 1.7,
            color: T.amberLed,
            textShadow: `0 0 4px ${T.amberLed}66`,
            boxShadow: "inset 0 2px 6px rgba(0,0,0,0.4)",
            whiteSpace: "pre-wrap" as const,
            wordBreak: "break-word" as const,
          }}
        >
          {displayText || (
            <Text
              span
              style={{
                color: "#1a1510",
                textShadow: "none",
                fontSize: "0.9rem",
                fontFamily: T.fontDisplay,
              }}
            >
              REFINED TEXT WILL APPEAR HERE...
            </Text>
          )}
          {refineStatus === "generating" && !refinedText && (
            <Text
              span
              style={{
                color: T.amberLed,
                animation: "blink 0.6s step-end infinite",
              }}
            >
              ▊
            </Text>
          )}
        </Box>

        {/* Error display */}
        {refineError && (
          <Text
            style={{
              fontFamily: T.fontLabel,
              fontSize: "0.55rem",
              color: "#ff4444",
              padding: "0.3rem 0",
            }}
          >
            {refineError}
          </Text>
        )}

        {/* Action buttons */}
        <Flex gap={8} justify="center" wrap="wrap">
          {!isActive ? (
            <Button
              onClick={refine}
              disabled={!outputText}
              styles={{
                root: {
                  ...buttonBase,
                  background: "linear-gradient(to bottom, #e04000, #c03000)",
                  color: "#fff",
                  boxShadow:
                    "0 3px 0 #801800, 0 4px 8px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.15)",
                  "&:active:not([data-disabled])": {
                    transform: "translateY(2px)",
                    boxShadow: "0 1px 0 #801800, 0 2px 4px rgba(0,0,0,0.2)",
                  },
                  "&[data-disabled]": {
                    background:
                      "linear-gradient(to bottom, #e04000, #c03000)",
                    opacity: 0.5,
                  },
                },
              }}
            >
              {refinedText ? "/// RE-GENERATE ///" : "/// GENERATE ///"}
            </Button>
          ) : (
            <Button
              onClick={abortRefine}
              styles={{
                root: {
                  ...buttonBase,
                  background: "linear-gradient(to bottom, #aa0000, #880000)",
                  color: "#fff",
                  boxShadow:
                    "0 3px 0 #550000, 0 4px 8px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.1)",
                  "&:active:not([data-disabled])": {
                    transform: "translateY(2px)",
                    boxShadow: "0 1px 0 #550000, 0 2px 4px rgba(0,0,0,0.2)",
                  },
                },
              }}
            >
              /// ABORT ///
            </Button>
          )}

          {refinedText && (
            <>
              <Tooltip
                label={copied ? "COPIED!" : "COPY REFINED"}
                position="top"
              >
                <Button
                  onClick={handleCopy}
                  styles={{
                    root: {
                      ...buttonBase,
                      background: "linear-gradient(to bottom, #444, #333)",
                      color: copied ? T.greenLed : "#aaa",
                      boxShadow:
                        "0 3px 0 #1a1a1a, 0 4px 8px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.08)",
                      "&:active:not([data-disabled])": {
                        transform: "translateY(2px)",
                        boxShadow:
                          "0 1px 0 #1a1a1a, 0 2px 4px rgba(0,0,0,0.2)",
                      },
                    },
                  }}
                >
                  {copied ? "COPIED" : "COPY"}
                </Button>
              </Tooltip>
              <Button
                onClick={handleUse}
                styles={{
                  root: {
                    ...buttonBase,
                    background: "linear-gradient(to bottom, #444, #333)",
                    color: "#aaa",
                    boxShadow:
                      "0 3px 0 #1a1a1a, 0 4px 8px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.08)",
                    "&:active:not([data-disabled])": {
                      transform: "translateY(2px)",
                      boxShadow:
                        "0 1px 0 #1a1a1a, 0 2px 4px rgba(0,0,0,0.2)",
                    },
                  },
                }}
              >
                USE AS INPUT
              </Button>
            </>
          )}
        </Flex>
      </Stack>
    </Modal>
  );
};
