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
            background: {
              default: '#121212', // 深色背景
              paper: '#1e1e1e',   // 卡片背景
            },
            primary: {
              main: '#bb86fc',   // 紫色主色调
              contrastText: '#fff'
            },
            secondary: {
              main: '#03dac6'    // 青色辅色
            },
            text: {
              primary: '#e0e0e0', // 主文本
              secondary: '#a0a0a0', // 次文本
            },
            divider: '#424242',   // 分隔线
          }
        : {
            // 浅色模式保持不变
          }),
    },
    // 添加全局组件样式覆盖
    components: {
      MuiPaper: {
        styleOverrides: {
          root: {
            backgroundImage: 'none',
            transition: 'background-color 0.3s ease'
          }
        }
      },
      MuiTableCell: {
        styleOverrides: {
          root: {
            borderBottom: `1px solid ${theme === 'dark' ? '#424242' : '#e0e0e0'}`
          }
        }
      },
      MuiDivider: {
        styleOverrides: {
          root: {
            borderColor: theme === 'dark' ? '#424242' : '#e0e0e0',
            borderBottomWidth: 2,
            opacity: 0.8
          }
        }
      },
      MuiButton: {
        styleOverrides: {
          root: {
            borderRadius: 8,
            fontWeight: 600,
            textTransform: 'none'
          },
          contained: ({ theme }) => ({
            backgroundColor: theme.palette.primary.main,
            color: '#fff',
            '&:hover': {
              backgroundColor: theme.palette.primary.dark
            }
          }),
          outlined: ({ theme }) => ({
            borderColor: theme.palette.mode === 'dark'
              ? theme.palette.divider
              : '#8e44ad',
            color: theme.palette.mode === 'dark'
              ? theme.palette.text.primary
              : '#8e44ad',
            '&:hover': {
              borderColor: theme.palette.primary.main,
              backgroundColor: theme.palette.action.hover
            }
          })
        }
      },
      MuiAppBar: {
        styleOverrides: {
          colorPrimary: theme === 'dark' ? {
            backgroundColor: '#23262F',
          } : {},
        }
      }
    }
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