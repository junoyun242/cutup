import { useState } from "react";
import {
  Box,
  Button,
  Flex,
  Group,
  Modal,
  Slider,
  Stack,
  Text,
  Tooltip,
} from "@mantine/core";
import { useCutUpStore } from "../../store/useCutUpStore";
import { countLineSyllables } from "../../utils/syllable";
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

const sliderStyles = {
  track: { height: 6, background: "#1a1a1e", borderColor: "transparent" },
  bar: {
    background: `linear-gradient(to right, ${T.amberLed}88, ${T.amberLed})`,
  },
  thumb: {
    width: 18,
    height: 18,
    background:
      "radial-gradient(circle at 40% 35%, #666, #3a3a3a 60%, #2a2a2a)",
    border: "2px solid #555",
    boxShadow: `0 0 6px rgba(255,149,0,0.3), 0 2px 4px rgba(0,0,0,0.5)`,
  },
  markLabel: { fontFamily: T.fontLabel, fontSize: "0.5rem", color: T.engravedText },
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
  const inputText = useCutUpStore((s) => s.inputText);
  const secondInputText = useCutUpStore((s) => s.secondInputText);
  const markovMode = useCutUpStore((s) => s.markovMode);
  const setMarkovMode = useCutUpStore((s) => s.setMarkovMode);
  const markovOrder = useCutUpStore((s) => s.markovOrder);
  const setMarkovOrder = useCutUpStore((s) => s.setMarkovOrder);
  const markovCount = useCutUpStore((s) => s.markovCount);
  const setMarkovCount = useCutUpStore((s) => s.setMarkovCount);
  const targetSyllables = useCutUpStore((s) => s.targetSyllables);
  const setTargetSyllables = useCutUpStore((s) => s.setTargetSyllables);
  const refinedText = useCutUpStore((s) => s.refinedText);
  const refine = useCutUpStore((s) => s.refine);

  const [copied, setCopied] = useState(false);

  const hasSource = inputText.trim() || secondInputText.trim();

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
    });
    onClose();
  };

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title="MARKOV CHAIN"
      centered
      size="lg"
      styles={modalStyles}
    >
      <Stack gap="md">
        {/* Mode Toggle */}
        <Group gap={4} justify="center">
          {(["word", "pos"] as const).map((mode) => (
            <Button
              key={mode}
              onClick={() => setMarkovMode(mode)}
              styles={{
                root: {
                  background: markovMode === mode
                    ? "linear-gradient(to bottom, #444, #333)"
                    : "transparent",
                  color: markovMode === mode ? T.amberLed : T.engravedText,
                  fontFamily: T.fontLabel,
                  fontSize: "0.6rem",
                  letterSpacing: "0.15em",
                  textTransform: "uppercase" as const,
                  border: markovMode === mode
                    ? `1px solid ${T.amberLed}44`
                    : "1px solid #333",
                  height: "auto",
                  padding: "0.4rem 0.8rem",
                  boxShadow: markovMode === mode
                    ? `0 0 8px ${T.amberLed}22, inset 0 1px 0 rgba(255,255,255,0.05)`
                    : "none",
                  transition: "all 150ms ease",
                  "&:hover": {
                    background: markovMode === mode
                      ? "linear-gradient(to bottom, #444, #333)"
                      : "rgba(255,255,255,0.03)",
                  },
                },
              }}
            >
              {mode === "word" ? "Word" : "POS (Grammar)"}
            </Button>
          ))}
        </Group>
        <Text
          ta="center"
          style={{
            ...smallLabelStyle,
            fontSize: "0.4rem",
            color: "#555",
          }}
        >
          {markovMode === "pos"
            ? "GRAMMAR-AWARE — CORRECT STRUCTURE, RANDOM WORDS"
            : "WORD CHAIN — FOLLOWS ORIGINAL WORD PATTERNS"}
        </Text>

        {/* Controls */}
        <Group gap="lg" justify="center" w="100%" wrap="wrap">
          <Stack align="center" gap={6} style={{ flex: 1, minWidth: 80, maxWidth: 160 }}>
            <Text style={smallLabelStyle}>Order</Text>
            <Text
              style={{
                fontFamily: T.fontDisplay,
                fontSize: "1.6rem",
                color: T.amberLed,
                textShadow: "0 0 8px rgba(255,149,0,0.5)",
                lineHeight: 1,
              }}
            >
              {markovOrder}
            </Text>
            <Slider
              value={markovOrder}
              onChange={setMarkovOrder}
              min={1}
              max={4}
              step={1}
              label={null}
              style={{ width: "100%" }}
              styles={sliderStyles}
              marks={[
                { value: 1, label: "1" },
                { value: 4, label: "4" },
              ]}
            />
            <Text style={{ ...smallLabelStyle, fontSize: "0.4rem", color: "#555" }}>
              LOW = SURREAL / HIGH = COHERENT
            </Text>
          </Stack>
          <Stack align="center" gap={6} style={{ flex: 1, minWidth: 80, maxWidth: 160 }}>
            <Text style={smallLabelStyle}>Lines</Text>
            <Text
              style={{
                fontFamily: T.fontDisplay,
                fontSize: "1.6rem",
                color: T.amberLed,
                textShadow: "0 0 8px rgba(255,149,0,0.5)",
                lineHeight: 1,
              }}
            >
              {markovCount}
            </Text>
            <Slider
              value={markovCount}
              onChange={setMarkovCount}
              min={1}
              max={12}
              step={1}
              label={null}
              style={{ width: "100%" }}
              styles={sliderStyles}
              marks={[
                { value: 1, label: "1" },
                { value: 12, label: "12" },
              ]}
            />
          </Stack>
          <Stack align="center" gap={6} style={{ flex: 1, minWidth: 80, maxWidth: 160 }}>
            <Text style={smallLabelStyle}>Syllable</Text>
            <Text
              style={{
                fontFamily: T.fontDisplay,
                fontSize: "1.6rem",
                color: T.amberLed,
                textShadow: "0 0 8px rgba(255,149,0,0.5)",
                lineHeight: 1,
              }}
            >
              {targetSyllables || "OFF"}
            </Text>
            <Slider
              value={targetSyllables}
              onChange={setTargetSyllables}
              min={0}
              max={16}
              step={1}
              label={null}
              style={{ width: "100%" }}
              styles={sliderStyles}
              marks={[
                { value: 0, label: "OFF" },
                { value: 16, label: "16" },
              ]}
            />
          </Stack>
        </Group>

        {/* Generate button */}
        <Flex justify="center">
          <Button
            onClick={refine}
            disabled={!hasSource}
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
                  background: "linear-gradient(to bottom, #e04000, #c03000)",
                  opacity: 0.5,
                },
              },
            }}
          >
            {refinedText ? "/// RE-GENERATE ///" : "/// GENERATE ///"}
          </Button>
        </Flex>

        {/* Output display */}
        <Box
          style={{
            background: "#050510",
            border: `1px solid ${refinedText ? T.amberLed + "33" : "#1a1a1e"}`,
            borderRadius: 2,
            padding: "1rem",
            minHeight: 100,
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
          {refinedText ? (
            refinedText.split("\n").map((line, i) => (
              <Flex key={i} gap={8} align="baseline">
                <Text
                  span
                  style={{
                    flex: 1,
                    fontFamily: T.fontDisplay,
                    fontSize: "1.1rem",
                    lineHeight: 1.7,
                    color: T.amberLed,
                    textShadow: `0 0 4px ${T.amberLed}66`,
                  }}
                >
                  {line}
                </Text>
                {line.trim() && (
                  <Text
                    span
                    style={{
                      fontFamily: T.fontLabel,
                      fontSize: "0.55rem",
                      color: T.vfdGreen,
                      textShadow: `0 0 4px ${T.vfdGreen}44`,
                      flexShrink: 0,
                      minWidth: 16,
                      textAlign: "right",
                    }}
                  >
                    {countLineSyllables(line)}
                  </Text>
                )}
              </Flex>
            ))
          ) : (
            <Text
              span
              style={{
                color: "#1a1510",
                textShadow: "none",
                fontSize: "0.9rem",
                fontFamily: T.fontDisplay,
              }}
            >
              MARKOV OUTPUT WILL APPEAR HERE...
            </Text>
          )}
        </Box>

        {/* Action buttons */}
        {refinedText && (
          <Flex gap={8} justify="center">
            <Tooltip
              label={copied ? "COPIED!" : "COPY"}
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
                      boxShadow: "0 1px 0 #1a1a1a, 0 2px 4px rgba(0,0,0,0.2)",
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
                    boxShadow: "0 1px 0 #1a1a1a, 0 2px 4px rgba(0,0,0,0.2)",
                  },
                },
              }}
            >
              USE AS INPUT
            </Button>
          </Flex>
        )}
      </Stack>
    </Modal>
  );
};
