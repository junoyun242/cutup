import { useRef } from 'react';
import { ActionIcon, Box, Button, Flex, Group, Stack, Text, Tooltip, UnstyledButton } from '@mantine/core';
import { useCutUpStore } from '../../store/useCutUpStore';
import { T } from '../../theme/tokens';

const formatTime = (timestamp: number): string => {
  const d = new Date(timestamp);
  return d.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
};

const secondaryButtonStyle = {
  root: {
    background: 'linear-gradient(to bottom, #444, #333)',
    color: '#aaa',
    fontFamily: T.fontLabel,
    fontSize: '0.55rem',
    letterSpacing: '0.12em',
    textTransform: 'uppercase' as const,
    border: 'none',
    height: 'auto',
    padding: '0.35rem 0.75rem',
    boxShadow: '0 2px 0 #1a1a1a, 0 3px 6px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.08)',
    '&:active:not([data-disabled])': {
      transform: 'translateY(2px)',
      boxShadow: '0 1px 0 #1a1a1a, 0 2px 4px rgba(0,0,0,0.2)',
    },
  },
};

export const HistoryModule = () => {
  const history = useCutUpStore((s) => s.history);
  const loadFromHistory = useCutUpStore((s) => s.loadFromHistory);
  const deleteHistoryEntry = useCutUpStore((s) => s.deleteHistoryEntry);
  const clearHistory = useCutUpStore((s) => s.clearHistory);
  const exportHistory = useCutUpStore((s) => s.exportHistory);
  const importHistory = useCutUpStore((s) => s.importHistory);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const json = ev.target?.result as string;
      importHistory(json);
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  if (history.length === 0) {
    return (
      <Stack align="center" gap="xs" py="sm">
        <Text
          ta="center"
          style={{
            fontFamily: T.fontLabel,
            fontSize: '0.6rem',
            letterSpacing: '0.2em',
            color: T.engravedText,
          }}
        >
          NO RECORDINGS YET
        </Text>
        <input
          ref={fileInputRef}
          type="file"
          accept=".json"
          onChange={handleImport}
          style={{ display: 'none' }}
        />
        <Button onClick={() => fileInputRef.current?.click()} styles={secondaryButtonStyle}>
          IMPORT
        </Button>
      </Stack>
    );
  }

  return (
    <Stack gap="xs">
      <Box style={{ maxHeight: 220, overflowY: 'auto' }}>
        <Stack gap={2}>
          {history.map((entry) => (
            <Flex
              key={entry.id}
              align="center"
              gap="xs"
              style={{
                padding: '0.4rem 0.6rem',
                background: 'rgba(0,0,0,0.3)',
                borderRadius: 2,
              }}
            >
              <UnstyledButton
                onClick={() => loadFromHistory(entry)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  flex: 1,
                  minWidth: 0,
                }}
              >
                <Text
                  style={{
                    fontFamily: T.fontDisplay,
                    fontSize: '0.85rem',
                    color: T.amberLed,
                    textShadow: '0 0 4px rgba(255,149,0,0.3)',
                    flexShrink: 0,
                  }}
                >
                  {formatTime(entry.timestamp)}
                </Text>
                <Text
                  style={{
                    fontFamily: T.fontDisplay,
                    fontSize: '0.8rem',
                    color: '#666',
                    flex: 1,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {entry.outputText.slice(0, 60)}
                </Text>
              </UnstyledButton>
              <Text
                style={{
                  fontFamily: T.fontLabel,
                  fontSize: '0.45rem',
                  letterSpacing: '0.1em',
                  color: T.engravedText,
                  flexShrink: 0,
                }}
              >
                {(entry.technique ?? 'cutup') === 'cutup'
                  ? `F${entry.fragmentSize} C${entry.chaosLevel}`
                  : entry.technique === 'permutation'
                    ? 'PRM'
                    : entry.technique === 'lineshuffle'
                      ? 'SHFL'
                      : entry.technique === 'foldin'
                        ? `W${entry.lineWidth ?? 60} F${entry.foldPosition ?? 50}%`
                        : ''}
              </Text>
              <Tooltip label="DELETE">
                <ActionIcon
                  variant="subtle"
                  size="xs"
                  onClick={() => deleteHistoryEntry(entry.id)}
                  styles={{ root: { color: '#444', '&:hover': { color: '#ff4444', background: 'transparent' } } }}
                >
                  <Text style={{ fontSize: '0.7rem', lineHeight: 1 }}>x</Text>
                </ActionIcon>
              </Tooltip>
            </Flex>
          ))}
        </Stack>
      </Box>
      <Group justify="flex-end" gap={6}>
        <input
          ref={fileInputRef}
          type="file"
          accept=".json"
          onChange={handleImport}
          style={{ display: 'none' }}
        />
        <Button onClick={() => fileInputRef.current?.click()} styles={secondaryButtonStyle}>
          IMPORT
        </Button>
        <Button onClick={exportHistory} styles={secondaryButtonStyle}>
          EXPORT
        </Button>
        <Button onClick={clearHistory} styles={secondaryButtonStyle}>
          CLEAR
        </Button>
      </Group>
    </Stack>
  );
};
