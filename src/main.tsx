import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { MantineProvider } from '@mantine/core';
import '@mantine/core/styles.css';
import './theme/global.css';
import { cutupTheme } from './theme/theme';
import App from './App';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <MantineProvider theme={cutupTheme} defaultColorScheme="dark">
      <App />
    </MantineProvider>
  </StrictMode>,
);
