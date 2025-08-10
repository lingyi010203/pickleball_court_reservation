import React, { createContext, useContext, useState, useEffect } from 'react';
import { ThemeProvider as MuiThemeProvider, createTheme } from '@mui/material/styles';

const ThemeContext = createContext();

// 定义颜色配置
const COLOR_CONFIG = {
  // 用户页面颜色配置
  user: {
    light: {
      primary: '#5e17eb', // 紫色
      primaryDark: '#4a0fd8',
      primaryLight: '#7c3aed',
    },
    dark: {
      primary: '#2d4aa1', // 蓝色
      primaryDark: '#1e3a8a',
      primaryLight: '#3b82f6',
    }
  },
  // Admin页面颜色配置
  admin: {
    light: {
      primary: '#2d4aa1', // 蓝色
      primaryDark: '#1e3a8a',
      primaryLight: '#3b82f6',
    },
    dark: {
      primary: '#5e17eb', // 紫色
      primaryDark: '#4a0fd8',
      primaryLight: '#7c3aed',
    }
  }
};

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => localStorage.getItem('adminTheme') || 'light');
  const [pageType, setPageType] = useState('user'); // 'user' or 'admin'

  useEffect(() => {
    localStorage.setItem('adminTheme', theme);
    document.body.setAttribute('data-theme', theme);
  }, [theme]);

  // 根据页面类型和主题模式获取主色调
  const getPrimaryColor = () => {
    const config = COLOR_CONFIG[pageType];
    return config[theme].primary;
  };

  const getPrimaryDarkColor = () => {
    const config = COLOR_CONFIG[pageType];
    return config[theme].primaryDark;
  };

  const getPrimaryLightColor = () => {
    const config = COLOR_CONFIG[pageType];
    return config[theme].primaryLight;
  };

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
              main: getPrimaryColor(),
              dark: getPrimaryDarkColor(),
              light: getPrimaryLightColor(),
              contrastText: '#ffffff',
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
            // ☀️ LIGHT MODE PALETTE
            background: {
              default: '#f5f5f9',
              paper: '#ffffff',
            },
            primary: {
              main: getPrimaryColor(),
              dark: getPrimaryDarkColor(),
              light: getPrimaryLightColor(),
              contrastText: '#ffffff',
            },
            secondary: {
              main: '#1976d2',
            },
            text: {
              primary: '#222',
              secondary: '#444',
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
            backgroundColor: getPrimaryColor(),
            color: '#ffffff',
            '&:hover': {
              backgroundColor: getPrimaryDarkColor(),
            },
          },
          outlinedPrimary: {
            borderColor: getPrimaryColor(),
            color: getPrimaryColor(),
            '&:hover': {
              borderColor: getPrimaryDarkColor(),
              backgroundColor: theme === 'dark' ? '#2c2c2c' : `${getPrimaryColor()}10`,
            },
          },
        },
      },
      MuiAppBar: {
        styleOverrides: {
          colorPrimary: {
            backgroundColor: theme === 'dark' ? '#23262F' : getPrimaryColor(),
            transition: 'background-color 0.3s ease',
          },
        },
      },
    },
  });

  return (
    <ThemeContext.Provider value={{ 
      theme, 
      setTheme, 
      pageType, 
      setPageType,
      getPrimaryColor,
      getPrimaryDarkColor,
      getPrimaryLightColor
    }}>
      <MuiThemeProvider theme={muiTheme}>
        {children}
      </MuiThemeProvider>
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
