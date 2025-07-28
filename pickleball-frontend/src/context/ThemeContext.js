import React, { createContext, useContext, useState, useEffect } from 'react';
import { ThemeProvider as MuiThemeProvider, createTheme } from '@mui/material/styles';

const ThemeContext = createContext();

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => localStorage.getItem('adminTheme') || 'light');

  useEffect(() => {
    localStorage.setItem('adminTheme', theme);
    document.body.setAttribute('data-theme', theme);
  }, [theme]);

  const muiTheme = createTheme({
    palette: {
      mode: theme,
      ...(theme === 'dark'
        ? {
            // 🌙 DARK MODE PALETTE
            background: {
              default: '#121212',
              paper: '#1e1e1e',
            },
            primary: {
              main: '#bb86fc',
              contrastText: '#fff',
            },
            secondary: {
              main: '#03dac6',
            },
            text: {
              primary: '#e0e0e0',
              secondary: '#a0a0a0',
            },
            divider: '#424242',
          }
        : {
            // ☀️ LIGHT MODE PALETTE (以紫色为主)
            background: {
              default: '#f5f5f9',
              paper: '#ffffff',
            },
            primary: {
              main: '#2d4aa1', // 深蓝
              dark: '#16204a',
              light: '#5d6bb0',
              contrastText: '#ffffff',
            },
            secondary: {
              main: '#1976d2', // 强调色/次色
            },
            text: {
              primary: '#222', // 正文偏黑色
              secondary: '#444', // 次要字体色
            },
            divider: '#e0e0e0',
          }),
    },
    components: {
      MuiPaper: {
        styleOverrides: {
          root: {
            backgroundImage: 'none',
            transition: 'background-color 0.3s ease',
          },
        },
      },
      MuiTableCell: {
        styleOverrides: {
          root: {
            borderBottom: `1px solid ${theme === 'dark' ? '#424242' : '#e0e0e0'}`,
          },
        },
      },
      MuiDivider: {
        styleOverrides: {
          root: {
            borderColor: theme === 'dark' ? '#424242' : '#e0e0e0',
            borderBottomWidth: 2,
            opacity: 0.8,
          },
        },
      },
      MuiButton: {
        styleOverrides: {
          root: {
            borderRadius: 8,
            fontWeight: 600,
            textTransform: 'none',
          },
          containedPrimary: {
            backgroundColor: '#8e44ad',
            color: '#fff',
            '&:hover': {
              backgroundColor: '#732d91',
            },
          },
          outlinedPrimary: {
            borderColor: theme === 'dark' ? '#bb86fc' : '#8e44ad',
            color: theme === 'dark' ? '#e0e0e0' : '#8e44ad',
            '&:hover': {
              borderColor: theme === 'dark' ? '#d0a6ff' : '#732d91',
              backgroundColor: theme === 'dark' ? '#2c2c2c' : '#f0e6f6',
            },
          },
        },
      },
      MuiAppBar: {
        styleOverrides: {
          colorPrimary: {
            backgroundColor: theme === 'dark' ? '#23262F' : '#8e44ad',
            transition: 'background-color 0.3s ease',
          },
        },
      },
    },
  });

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      <MuiThemeProvider theme={muiTheme}>
        {children}
      </MuiThemeProvider>
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
