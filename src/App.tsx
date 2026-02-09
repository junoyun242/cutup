import { Box, Flex, Stack, Text } from '@mantine/core';
import { ModulePanel } from './components/ModulePanel/ModulePanel';
import { InputModule } from './components/InputModule/InputModule';
import { ControlModule } from './components/ControlModule/ControlModule';
import { OutputModule } from './components/OutputModule/OutputModule';
import { HistoryModule } from './components/HistoryModule/HistoryModule';
import { useCutUpStore } from './store/useCutUpStore';
import { T } from './theme/tokens';

const App = () => {
  const technique = useCutUpStore((s) => s.technique);

  return (
    <Box
      style={{
        maxWidth: 900,
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        gap: 2,
        background: 'linear-gradient(135deg, #1e1e22, #16161a)',
        border: '2px solid #333',
        borderRadius: 6,
        boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <Flex
        align="center"
        gap="sm"
        px="sm"
        py={8}
        style={{
          background: 'linear-gradient(to bottom, #2a2a2e, #222226)',
          borderBottom: '1px solid #444',
        }}
      >
        <Flex align="center" gap={6}>
          <Box
            style={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              background: T.amberLed,
              boxShadow: T.amberGlow,
            }}
          />
          <Text
            style={{ fontFamily: T.fontLabel, fontSize: '0.5rem', letterSpacing: '0.15em', color: T.engravedText }}
          >
            PWR
          </Text>
        </Flex>
        <Text
          style={{
            fontFamily: T.fontLabel,
            fontSize: 'clamp(0.55rem, 2.5vw, 0.9rem)',
            letterSpacing: '0.35em',
            textTransform: 'uppercase',
            color: T.labelText,
            flex: 1,
            textAlign: 'center',
          }}
        >
          {technique === 'cutup' ? 'CUT-UP MACHINE' : technique === 'foldin' ? 'FOLD-IN MACHINE' : 'PERMUTATION MACHINE'}
        </Text>
        <Text
          style={{ fontFamily: T.fontLabel, fontSize: '0.55rem', color: T.engravedText, letterSpacing: '0.1em' }}
        >
          MK-II
        </Text>
      </Flex>

      {/* Body */}
      <Stack gap={2} p={2}>
        <ModulePanel label="Input">
          <InputModule />
        </ModulePanel>

        <ModulePanel label="Controls">
          <ControlModule />
        </ModulePanel>

        <ModulePanel label="Output">
          <OutputModule />
        </ModulePanel>

        <ModulePanel label="Tape History">
          <HistoryModule />
        </ModulePanel>
      </Stack>
    </Box>
  );
};

export default App;
