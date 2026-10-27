'use client';

import '@mantine/core/styles.css';
import '@mantine/notifications/styles.css';
import { createTheme, MantineProvider } from '@mantine/core';
import { Notifications } from '@mantine/notifications';

const theme = createTheme({
  primaryColor: 'dark',
  defaultRadius: 'xl',
  fontFamily: 'var(--font-sans), -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  fontFamilyMonospace: 'var(--font-mono), monospace',
  headings: {
    fontFamily: 'var(--font-sans), -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  },
  colors: {
    dark: [
      '#f5f5f4', // 0
      '#ebeae8', // 1
      '#d7d6d3', // 2
      '#a8a7a4', // 3
      '#73726f', // 4
      '#444341', // 5
      '#282725', // 6
      '#1c1c1b', // 7
      '#121211', // 8
      '#0a0a0a', // 9 (primary ink)
    ],
  },
  components: {
    Button: {
      defaultProps: {
        radius: 'xl',
      },
      styles: {
        root: {
          fontFamily: 'var(--font-mono), monospace',
          textTransform: 'uppercase',
          letterSpacing: '0.08em',
          fontWeight: 600,
          fontSize: '0.78rem',
          transition: 'all 0.18s cubic-bezier(0.16, 1, 0.3, 1)',
        },
      },
    },
    Badge: {
      defaultProps: {
        radius: 'xl',
      },
      styles: {
        root: {
          fontFamily: 'var(--font-mono), monospace',
          textTransform: 'uppercase',
          letterSpacing: '0.06em',
          fontWeight: 600,
          fontSize: '0.72rem',
        },
      },
    },
    Card: {
      defaultProps: {
        radius: '20px',
        withBorder: true,
      },
      styles: {
        root: {
          backgroundColor: '#ffffff',
          borderColor: 'rgba(10, 10, 10, 0.08)',
          boxShadow: '0 1px 2px rgba(0,0,0,0.04), 0 8px 30px rgba(0,0,0,0.06)',
        },
      },
    },
    TextInput: {
      defaultProps: {
        radius: 'md',
      },
      styles: {
        input: {
          backgroundColor: '#ffffff',
          borderColor: 'rgba(10, 10, 10, 0.12)',
          color: '#0a0a0a',
          fontSize: '0.9rem',
          '&:focus': {
            borderColor: '#0a0a0a',
          },
        },
        label: {
          fontFamily: 'var(--font-mono), monospace',
          textTransform: 'uppercase',
          letterSpacing: '0.06em',
          fontSize: '0.72rem',
          fontWeight: 600,
          color: '#5b6070',
          marginBottom: 4,
        },
      },
    },
  },
});

export default function MantineClientProvider({ children }) {
  return (
    <MantineProvider theme={theme} defaultColorScheme="light">
      <Notifications position="top-right" zIndex={1000} autoClose={3500} />
      {children}
    </MantineProvider>
  );
}
