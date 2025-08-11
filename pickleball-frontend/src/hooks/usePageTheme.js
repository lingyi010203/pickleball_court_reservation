import { useEffect } from 'react';
import { useTheme } from '../context/ThemeContext';

export const usePageTheme = (pageType) => {
  const { setPageType } = useTheme();

  useEffect(() => {
    setPageType(pageType);
  }, [pageType, setPageType]);
}; 