import { useEffect } from 'react';
import { useTheme } from '../context/ThemeContext';

export const usePageTheme = (pageType) => {
  const { setPageType } = useTheme();

  useEffect(() => {
    setPageType(pageType);
    
    // 清理函数：当组件卸载时重置为user类型
    return () => {
      setPageType('user');
    };
  }, [pageType, setPageType]);
}; 