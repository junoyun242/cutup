import { useState } from 'react';
import { Box, Flex, Text, Textarea } from '@mantine/core';
import { useCutUpStore } from '../../store/useCutUpStore';
import { T } from '../../theme/tokens';

const textareaStyles = {
  input: {
    background: '#0a0a0c',
    border: `2px solid ${T.grooveDark}`,
    borderRadius: 2,
    color: T.vfdGreen,
    fontFamily: T.fontDisplay,
    fontSize: '1.05rem',
    padding: '1rem',
    boxShadow: 'inset 0 0 30px rgba(0,255,136,0.02), inset 0 2px 4px rgba(0,0,0,0.5)',
    resize: 'none' as const,
    lineHeight: 1.5,
    '&::placeholder': {
      color: '#1a3a2a',
      fontFamily: T.fontDisplay,
    },
    '&:focus': {
      borderColor: 'rgba(0,255,136,0.2)',
      boxShadow: 'inset 0 0 30px rgba(0,255,136,0.03), inset 0 2px 4px rgba(0,0,0,0.5), 0 0 0 1px rgba(0,255,136,0.1)',
    },
  },
};

const scanlineOverlay = {
  position: 'absolute' as const,
  inset: 0,
  background: 'repeating-linear-gradient(transparent, transparent 2px, rgba(0,0,0,0.04) 2px, rgba(0,0,0,0.04) 4px)',
  pointerEvents: 'none' as const,
  borderRadius: 2,
};

const wordCountStyle = {
  fontFamily: T.fontLabel,
  fontSize: '0.5rem',
  color: T.engravedText,
  letterSpacing: '0.1em',
};

const InputArea = ({
  value,
  onChange,
  placeholder,
  label,
  minRows = 6,
}: {
  value: string;
  onChange: (text: string) => void;
  placeholder: string;
  label?: string;
  minRows?: number;
}) => {
  const wordCount = value.trim() ? value.trim().split(/\s+/).length : 0;

  return (
    <Box pos="relative">
      {label && (
        <Text style={{ ...wordCountStyle, marginBottom: 4 }}>
          {label}
        </Text>
      )}
      <Box pos="relative">
        <Textarea
          value={value}
          onChange={(e) => onChange(e.currentTarget.value)}
          placeholder={placeholder}
          autosize
          minRows={minRows}
          maxRows={14}
          styles={textareaStyles}
        />
        <Box style={scanlineOverlay} />
      </Box>
      <Flex justify="space-between" mt={6} px={2}>
        <Text style={wordCountStyle}>
          {wordCount > 0 ? `${wordCount} WORDS` : ''}
        </Text>
        {value && (
          <Text
            style={{ ...wordCountStyle, cursor: 'pointer' }}
            onClick={() => onChange('')}
          >
            CLEAR
          </Text>
        )}
      </Flex>
    </Box>
  );
};

const addSourceStyle = {
  fontFamily: T.fontLabel,
  fontSize: '0.5rem',
  color: T.engravedText,
  letterSpacing: '0.1em',
  cursor: 'pointer',
  textAlign: 'center' as const,
  padding: '0.5rem',
  border: `1px dashed ${T.grooveDark}`,
  borderRadius: 2,
};

export const InputModule = () => {
  const inputText = useCutUpStore((s) => s.inputText);
  const setInputText = useCutUpStore((s) => s.setInputText);
  const secondInputText = useCutUpStore((s) => s.secondInputText);
  const setSecondInputText = useCutUpStore((s) => s.setSecondInputText);
  const technique = useCutUpStore((s) => s.technique);
  const [showSecondSource, setShowSecondSource] = useState(false);

  // Fold-in always shows two inputs
  if (technique === 'foldin') {
    return (
      <Flex gap="sm">
        <Box style={{ flex: 1 }}>
          <InputArea
            value={inputText}
            onChange={setInputText}
            placeholder="TEXT A — FIRST SHEET..."
            label="SHEET A"
          />
        </Box>
        <Box style={{ flex: 1 }}>
          <InputArea
            value={secondInputText}
            onChange={setSecondInputText}
            placeholder="TEXT B — SECOND SHEET..."
            label="SHEET B"
          />
        </Box>
      </Flex>
    );
  }

  // Permutation — single input, short phrase
  if (technique === 'permutation') {
    return (
      <InputArea
        value={inputText}
        onChange={setInputText}
        placeholder="ENTER A SHORT PHRASE..."
        minRows={2}
      />
    );
  }

  // Cut-up — primary input + optional second source
  const hasSecondSource = showSecondSource || secondInputText.trim().length > 0;

  return (
    <>
      {hasSecondSource ? (
        <Flex gap="sm">
          <Box style={{ flex: 1 }}>
            <InputArea
              value={inputText}
              onChange={setInputText}
              placeholder="TEXT A — FIRST SOURCE..."
              label="SOURCE A"
            />
          </Box>
          <Box style={{ flex: 1 }}>
            <InputArea
              value={secondInputText}
              onChange={(text) => {
                setSecondInputText(text);
                if (!text.trim()) setShowSecondSource(false);
              }}
              placeholder="TEXT B — SECOND SOURCE..."
              label="SOURCE B"
            />
          </Box>
        </Flex>
      ) : (
        <>
          <InputArea
            value={inputText}
            onChange={setInputText}
            placeholder="PASTE OR TYPE YOUR LYRICS HERE..."
          />
          <Box
            style={addSourceStyle}
            onClick={() => setShowSecondSource(true)}
          >
            + ADD SECOND SOURCE
          </Box>
        </>
      )}
    </>
  );
};
