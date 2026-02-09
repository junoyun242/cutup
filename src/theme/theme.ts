import { createTheme, type MantineColorsTuple } from '@mantine/core';

const amber: MantineColorsTuple = [
  '#fff4e0',
  '#ffe6b8',
  '#ffd48a',
  '#ffc35c',
  '#ffb12e',
  '#ff9500',
  '#e68600',
  '#cc7600',
  '#b36700',
  '#995800',
];

export const cutupTheme = createTheme({
  fontFamily: "'Share Tech Mono', monospace",
  primaryColor: 'amber',
  colors: {
    amber,
  },
  defaultRadius: 'xs',
});
