import { useState } from "react";
import { ActionIcon, Box, Flex, Text, Tooltip } from "@mantine/core";
import { useCutUpStore } from "../../store/useCutUpStore";
import { RefineModal } from "../RefineModal/RefineModal";
import { T } from "../../theme/tokens";

const actionLabelStyle = {
  fontFamily: T.fontLabel,
  fontSize: "0.55rem",
  letterSpacing: "0.1em",
};

export const OutputModule = () => {
  const outputText = useCutUpStore((s) => s.outputText);
  const isProcessing = useCutUpStore((s) => s.isProcessing);
  const copyOutput = useCutUpStore((s) => s.copyOutput);
  const useOutputAsInput = useCutUpStore((s) => s.useOutputAsInput);
  const refinedText = useCutUpStore((s) => s.refinedText);

  const [copied, setCopied] = useState(false);
  const [copiedRefined, setCopiedRefined] = useState(false);
  const [refineModalOpen, setRefineModalOpen] = useState(false);

  const handleCopy = async () => {
    await copyOutput();
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const handleCopyRefined = async () => {
    if (!refinedText) return;
    await navigator.clipboard.writeText(refinedText);
    setCopiedRefined(true);
    setTimeout(() => setCopiedRefined(false), 1500);
  };

  return (
    <>
      <Box pos="relative">
        <Box
          style={{
            background: "#050510",
            border: "2px solid #1a1a1e",
            borderRadius: 2,
            padding: "1.5rem",
            minHeight: 120,
            fontFamily: T.fontDisplay,
            fontSize: "1.3rem",
            lineHeight: 1.7,
            color: T.vfdGreen,
            textShadow: `0 0 6px ${T.vfdGreen}, 0 0 12px rgba(0,255,136,0.15)`,
            boxShadow: "inset 0 2px 8px rgba(0,0,0,0.6)",
            whiteSpace: "pre-wrap" as const,
            wordBreak: "break-word" as const,
            animation: isProcessing
              ? "glitch 0.15s steps(3) infinite"
              : "none",
          }}
        >
          {outputText || (
            <Text
              span
              style={{
                color: "#152015",
                textShadow: "none",
                fontSize: "1rem",
                fontFamily: T.fontDisplay,
              }}
            >
              OUTPUT WILL APPEAR HERE...
            </Text>
          )}
        </Box>
        {/* Scanlines */}
        <Box
          style={{
            position: "absolute",
            inset: 0,
            background:
              "repeating-linear-gradient(transparent, transparent 3px, rgba(0,0,0,0.03) 3px, rgba(0,0,0,0.03) 6px)",
            pointerEvents: "none",
            borderRadius: 2,
          }}
        />
        {/* Action buttons */}
        {outputText && (
          <Flex gap={6} mt={8} justify="flex-end" align="center">
            <Tooltip label="REFINE WITH AI" position="top">
              <ActionIcon
                variant="subtle"
                onClick={() => setRefineModalOpen(true)}
                styles={{
                  root: {
                    color: refinedText ? T.amberLed : T.engravedText,
                    "&:hover": { background: "rgba(255,255,255,0.05)" },
                  },
                }}
              >
                <Text style={actionLabelStyle}>RFN</Text>
              </ActionIcon>
            </Tooltip>
            <Tooltip label={copied ? "COPIED!" : "COPY"} position="top">
              <ActionIcon
                variant="subtle"
                onClick={handleCopy}
                styles={{
                  root: {
                    color: copied ? T.greenLed : T.engravedText,
                    fontFamily: T.fontLabel,
                    fontSize: "0.5rem",
                    "&:hover": { background: "rgba(255,255,255,0.05)" },
                  },
                }}
              >
                <Text style={actionLabelStyle}>{copied ? "OK" : "CPY"}</Text>
              </ActionIcon>
            </Tooltip>
            <Tooltip label="USE AS INPUT" position="top">
              <ActionIcon
                variant="subtle"
                onClick={useOutputAsInput}
                styles={{
                  root: {
                    color: T.engravedText,
                    "&:hover": { background: "rgba(255,255,255,0.05)" },
                  },
                }}
              >
                <Text style={actionLabelStyle}>INP</Text>
              </ActionIcon>
            </Tooltip>
          </Flex>
        )}
      </Box>

      {/* Refined output (persisted below main output) */}
      {refinedText && (
        <Box mt={8}>
          <Flex align="center" justify="space-between" mb={4}>
            <Text
              style={{
                fontFamily: T.fontLabel,
                fontSize: "0.5rem",
                color: T.amberLed,
                letterSpacing: "0.15em",
              }}
            >
              REFINED
            </Text>
            <Tooltip
              label={copiedRefined ? "COPIED!" : "COPY REFINED"}
              position="top"
            >
              <ActionIcon
                variant="subtle"
                size="xs"
                onClick={handleCopyRefined}
                styles={{
                  root: {
                    color: copiedRefined ? T.greenLed : T.engravedText,
                    "&:hover": { background: "rgba(255,255,255,0.05)" },
                  },
                }}
              >
                <Text style={actionLabelStyle}>
                  {copiedRefined ? "OK" : "CPY"}
                </Text>
              </ActionIcon>
            </Tooltip>
          </Flex>
          <Box
            pos="relative"
            style={{
              background: "#080812",
              border: `1px solid ${T.amberLed}22`,
              borderRadius: 2,
              padding: "1rem",
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
            {refinedText}
          </Box>
        </Box>
      )}

      {/* Refine Modal */}
      <RefineModal
        opened={refineModalOpen}
        onClose={() => setRefineModalOpen(false)}
      />
    </>
  );
};
