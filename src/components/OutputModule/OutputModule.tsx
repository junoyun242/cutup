import { useMemo, useState } from "react";
import { ActionIcon, Box, Button, Flex, Group, Text, TextInput, Tooltip } from "@mantine/core";
import { useCutUpStore } from "../../store/useCutUpStore";
import { RefineModal } from "../RefineModal/RefineModal";
import { countLineSyllables } from "../../utils/syllable";
import { POS_CATEGORIES, tagWords } from "../../utils/posMarkov";
import { T } from "../../theme/tokens";

const actionLabelStyle = {
  fontFamily: T.fontLabel,
  fontSize: "0.55rem",
  letterSpacing: "0.1em",
};

const ErasureGrid = () => {
  const erasureLines = useCutUpStore((s) => s.erasureLines);
  const erasureSelected = useCutUpStore((s) => s.erasureSelected);
  const toggleErasureWord = useCutUpStore((s) => s.toggleErasureWord);

  const hasAnySelected = erasureSelected.some((line) =>
    line.some((s) => s),
  );

  return (
    <Box>
      {!hasAnySelected && (
        <Text
          ta="center"
          mb="xs"
          style={{
            fontFamily: T.fontLabel,
            fontSize: "0.55rem",
            letterSpacing: "0.15em",
            color: T.amberLed,
            textShadow: `0 0 4px ${T.amberLed}44`,
            animation: "pulse 2s ease-in-out infinite",
          }}
        >
          TAP WORDS TO REVEAL — COPY KEEPS ONLY SELECTED
        </Text>
      )}
      {erasureLines.map((line, lineIdx) => (
        <Box key={lineIdx} style={{ marginBottom: "0.3rem" }}>
          {line.map((word, wordIdx) => {
            const selected = erasureSelected[lineIdx]?.[wordIdx] ?? false;
            return (
              <Text
                key={wordIdx}
                span
                onClick={() => toggleErasureWord(lineIdx, wordIdx)}
                style={{
                  cursor: "pointer",
                  color: selected ? T.vfdGreen : "#222",
                  textShadow: selected
                    ? `0 0 6px ${T.vfdGreen}, 0 0 12px rgba(0,255,136,0.15)`
                    : "none",
                  fontFamily: T.fontDisplay,
                  fontSize: "1.3rem",
                  lineHeight: 1.7,
                  padding: "0.1rem 0.15rem",
                  borderRadius: 2,
                  transition: "all 0.15s ease",
                  userSelect: "none",
                }}
              >
                {word}{" "}
              </Text>
            );
          })}
        </Box>
      ))}
    </Box>
  );
};

const OutputLines = ({
  text,
  showSyllables,
  filterWord,
  posFilterTags,
}: {
  text: string;
  showSyllables: boolean;
  filterWord: string;
  posFilterTags: string[];
}) => {
  const lines = text.split("\n");
  const filter = filterWord.trim().toLowerCase();
  const hasPosFilter = posFilterTags.length > 0;

  // Tag all words for POS filtering
  const taggedLines = useMemo(() => {
    if (!hasPosFilter) return null;
    return lines.map((line) => tagWords(line));
  }, [text, posFilterTags.length > 0]);

  return (
    <>
      {lines.map((line, i) => {
        const matchesFilter =
          !filter || line.toLowerCase().includes(filter);
        if (!matchesFilter) return null;
        return (
          <Flex
            key={i}
            gap={8}
            align="baseline"
          >
            <Text
              span
              style={{
                flex: 1,
                fontFamily: T.fontDisplay,
                fontSize: "1.3rem",
                lineHeight: 1.7,
              }}
            >
              {hasPosFilter && taggedLines
                ? taggedLines[i].map((tw, j) => {
                    const match = posFilterTags.includes(tw.pos);
                    return (
                      <Text
                        key={j}
                        span
                        style={{
                          color: match ? T.vfdGreen : "#1a2a1a",
                          textShadow: match
                            ? `0 0 6px ${T.vfdGreen}, 0 0 12px rgba(0,255,136,0.15)`
                            : "none",
                          transition: "all 0.15s ease",
                        }}
                      >
                        {tw.text}{" "}
                      </Text>
                    );
                  })
                : (
                  <Text
                    span
                    style={{
                      color: T.vfdGreen,
                      textShadow: `0 0 6px ${T.vfdGreen}, 0 0 12px rgba(0,255,136,0.15)`,
                    }}
                  >
                    {line}
                  </Text>
                )}
            </Text>
            {showSyllables && line.trim() && (
              <Text
                span
                style={{
                  fontFamily: T.fontLabel,
                  fontSize: "0.55rem",
                  color: T.amberLed,
                  textShadow: `0 0 4px ${T.amberLed}44`,
                  flexShrink: 0,
                  minWidth: 20,
                  textAlign: "right",
                }}
              >
                {countLineSyllables(line)}
              </Text>
            )}
          </Flex>
        );
      })}
    </>
  );
};

export const OutputModule = () => {
  const outputText = useCutUpStore((s) => s.outputText);
  const isProcessing = useCutUpStore((s) => s.isProcessing);
  const technique = useCutUpStore((s) => s.technique);
  const copyOutput = useCutUpStore((s) => s.copyOutput);
  const useOutputAsInput = useCutUpStore((s) => s.useOutputAsInput);
  const refinedText = useCutUpStore((s) => s.refinedText);
  const erasureLines = useCutUpStore((s) => s.erasureLines);
  const showSyllables = useCutUpStore((s) => s.showSyllables);
  const toggleSyllables = useCutUpStore((s) => s.toggleSyllables);
  const filterWord = useCutUpStore((s) => s.filterWord);
  const setFilterWord = useCutUpStore((s) => s.setFilterWord);
  const showPosFilter = useCutUpStore((s) => s.showPosFilter);
  const toggleShowPosFilter = useCutUpStore((s) => s.toggleShowPosFilter);
  const posFilterTags = useCutUpStore((s) => s.posFilterTags);
  const togglePosFilterTag = useCutUpStore((s) => s.togglePosFilterTag);

  const [copied, setCopied] = useState(false);
  const [copiedRefined, setCopiedRefined] = useState(false);
  const [refineModalOpen, setRefineModalOpen] = useState(false);
  const [showFilter, setShowFilter] = useState(false);

  const hasOutput =
    technique === "erasure" ? erasureLines.length > 0 : !!outputText;

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
            boxShadow: "inset 0 2px 8px rgba(0,0,0,0.6)",
            whiteSpace: "pre-wrap" as const,
            wordBreak: "break-word" as const,
            animation: isProcessing
              ? "glitch 0.15s steps(3) infinite"
              : "none",
          }}
        >
          {technique === "erasure" && erasureLines.length > 0 ? (
            <ErasureGrid />
          ) : outputText ? (
            <OutputLines
              text={outputText}
              showSyllables={showSyllables}
              filterWord={filterWord}
              posFilterTags={posFilterTags}
            />
          ) : (
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

        {/* Filter input */}
        {showFilter && hasOutput && technique !== "erasure" && (
          <Box mt={6}>
            <TextInput
              value={filterWord}
              onChange={(e) => setFilterWord(e.currentTarget.value)}
              placeholder="FILTER BY WORD..."
              size="xs"
              styles={{
                input: {
                  background: "#0a0a0c",
                  border: "1px solid #333",
                  color: T.vfdGreen,
                  fontFamily: T.fontLabel,
                  fontSize: "0.6rem",
                  letterSpacing: "0.1em",
                  padding: "0.3rem 0.5rem",
                  height: "auto",
                  "&::placeholder": { color: "#1a3a2a" },
                },
              }}
            />
          </Box>
        )}

        {/* POS filter tags */}
        {showPosFilter && hasOutput && technique !== "erasure" && (
          <Group gap={4} mt={6} justify="center">
            {POS_CATEGORIES.map(({ key, label }) => {
              const active = posFilterTags.includes(key);
              return (
                <Button
                  key={key}
                  size="compact-xs"
                  onClick={() => togglePosFilterTag(key)}
                  styles={{
                    root: {
                      background: active
                        ? "linear-gradient(to bottom, #444, #333)"
                        : "transparent",
                      color: active ? T.vfdGreen : T.engravedText,
                      fontFamily: T.fontLabel,
                      fontSize: "0.5rem",
                      letterSpacing: "0.1em",
                      border: active
                        ? `1px solid ${T.vfdGreen}44`
                        : "1px solid #333",
                      height: "auto",
                      padding: "0.25rem 0.5rem",
                      transition: "all 150ms ease",
                      "&:hover": {
                        background: active
                          ? "linear-gradient(to bottom, #444, #333)"
                          : "rgba(255,255,255,0.03)",
                      },
                    },
                  }}
                >
                  {label}
                </Button>
              );
            })}
          </Group>
        )}

        {/* Action buttons */}
        {hasOutput && (
          <Flex gap={6} mt={8} justify="flex-end" align="center">
            {technique !== "erasure" && (
              <>
                <Tooltip
                  label={
                    showSyllables
                      ? "HIDE SYLLABLE COUNT"
                      : "SHOW SYLLABLE COUNT"
                  }
                  position="top"
                >
                  <ActionIcon
                    variant="subtle"
                    onClick={toggleSyllables}
                    styles={{
                      root: {
                        color: showSyllables ? T.amberLed : T.engravedText,
                        "&:hover": { background: "rgba(255,255,255,0.05)" },
                      },
                    }}
                  >
                    <Text style={actionLabelStyle}>SYL</Text>
                  </ActionIcon>
                </Tooltip>
                <Tooltip
                  label={showFilter ? "HIDE FILTER" : "FILTER LINES"}
                  position="top"
                >
                  <ActionIcon
                    variant="subtle"
                    onClick={() => {
                      setShowFilter((v) => !v);
                      if (showFilter) setFilterWord("");
                    }}
                    styles={{
                      root: {
                        color: showFilter ? T.amberLed : T.engravedText,
                        "&:hover": { background: "rgba(255,255,255,0.05)" },
                      },
                    }}
                  >
                    <Text style={actionLabelStyle}>FLT</Text>
                  </ActionIcon>
                </Tooltip>
                <Tooltip
                  label={showPosFilter ? "HIDE POS FILTER" : "POS FILTER"}
                  position="top"
                >
                  <ActionIcon
                    variant="subtle"
                    onClick={toggleShowPosFilter}
                    styles={{
                      root: {
                        color: showPosFilter ? T.amberLed : T.engravedText,
                        "&:hover": { background: "rgba(255,255,255,0.05)" },
                      },
                    }}
                  >
                    <Text style={actionLabelStyle}>POS</Text>
                  </ActionIcon>
                </Tooltip>
                <Tooltip label="MARKOV CHAIN" position="top">
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
                    <Text style={actionLabelStyle}>MKV</Text>
                  </ActionIcon>
                </Tooltip>
              </>
            )}
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

      {/* Markov output */}
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
              MARKOV
            </Text>
            <Tooltip
              label={copiedRefined ? "COPIED!" : "COPY MARKOV"}
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

      <RefineModal
        opened={refineModalOpen}
        onClose={() => setRefineModalOpen(false)}
      />
    </>
  );
};
