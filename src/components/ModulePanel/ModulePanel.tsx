import type { ReactNode } from 'react';
import { Box, Paper, Text } from '@mantine/core';
import { T } from '../../theme/tokens';

interface ModulePanelProps {
  label: string;
  children: ReactNode;
}

const Screw = ({ top, left, right, bottom }: { top?: number; bottom?: number; left?: number; right?: number }) => (
  <Box
    style={{
      position: 'absolute',
      top,
      left,
      right,
      bottom,
      width: 12,
      height: 12,
      borderRadius: '50%',
      background: 'radial-gradient(circle at 35% 35%, #777, #444 50%, #2a2a2a)',
      boxShadow: '0 1px 2px rgba(0,0,0,0.6), inset 0 0 1px rgba(255,255,255,0.1)',
      zIndex: 2,
    }}
  >
    <Box
      style={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%,-50%)',
        width: 7,
        height: 1,
        background: '#1a1a1a',
      }}
    />
    <Box
      style={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%,-50%)',
        width: 1,
        height: 7,
        background: '#1a1a1a',
      }}
    />
  </Box>
);

export const ModulePanel = ({ label, children }: ModulePanelProps) => (
  <Paper
    style={{
      background: T.panelMid,
      border: `1px solid ${T.grooveLight}`,
      borderRadius: 4,
      boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.03), inset 0 -1px 0 rgba(0,0,0,0.4), 0 4px 12px rgba(0,0,0,0.5)',
      position: 'relative',
      padding: '2rem 1.5rem 1.5rem',
    }}
  >
    <Screw top={8} left={8} />
    <Screw top={8} right={8} />
    <Screw bottom={8} left={8} />
    <Screw bottom={8} right={8} />
    <Text
      style={{
        position: 'absolute',
        top: 10,
        left: '50%',
        transform: 'translateX(-50%)',
        fontFamily: T.fontLabel,
        fontSize: '0.6rem',
        textTransform: 'uppercase',
        letterSpacing: '0.25em',
        color: T.engravedText,
        textShadow: '0 1px 0 rgba(255,255,255,0.04)',
        whiteSpace: 'nowrap',
        userSelect: 'none',
      }}
    >
      {label}
    </Text>
    <Box mt={4}>{children}</Box>
  </Paper>
);
