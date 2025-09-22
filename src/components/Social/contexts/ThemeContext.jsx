import React, { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext();

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export const ThemeProvider = ({ children }) => {
  // Initialize theme from localStorage or default to 'light'
  const [theme, setTheme] = useState(() => {
    const savedTheme = localStorage.getItem('social-theme');
    if (savedTheme) {
      return savedTheme;
    }
    
    // Check system preference
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'system';
    }
    
    return 'light';
  });

  // Apply theme to document
  useEffect(() => {
    const applyTheme = (themeToApply) => {
      const socialContainer = document.querySelector('.social-app');
      if (socialContainer) {
        // Remove all theme classes
        socialContainer.classList.remove('theme-light', 'theme-dark', 'theme-system');
        
        // Add current theme class
        socialContainer.classList.add(`theme-${themeToApply}`);
        
        // For system theme, also add the actual resolved theme
        if (themeToApply === 'system') {
          const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
          socialContainer.classList.add(systemPrefersDark ? 'theme-dark-resolved' : 'theme-light-resolved');
        }
      }
    };

    applyTheme(theme);
    
    // Save to localStorage
    localStorage.setItem('social-theme', theme);
  }, [theme]);

  // Listen for system theme changes when using system theme
  useEffect(() => {
    if (theme === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      
      const handleSystemThemeChange = (e) => {
        const socialContainer = document.querySelector('.social-app');
        if (socialContainer) {
          socialContainer.classList.remove('theme-dark-resolved', 'theme-light-resolved');
          socialContainer.classList.add(e.matches ? 'theme-dark-resolved' : 'theme-light-resolved');
        }
      };

      mediaQuery.addListener(handleSystemThemeChange);
      
      return () => {
        mediaQuery.removeListener(handleSystemThemeChange);
      };
    }
  }, [theme]);

  const changeTheme = (newTheme) => {
    if (['light', 'dark', 'system'].includes(newTheme)) {
      setTheme(newTheme);
    }
  };

  const getResolvedTheme = () => {
    if (theme === 'system') {
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return theme;
  };

  const value = {
    theme,
    resolvedTheme: getResolvedTheme(),
    changeTheme,
    isDark: getResolvedTheme() === 'dark'
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};

export default ThemeContext; 