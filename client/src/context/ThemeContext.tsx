import React, { createContext, useState, useEffect, useContext } from 'react';
import { useAuth } from './AuthContext';

// Define the theme type
type Theme = 'light' | 'dark';

// Define the shape of theme context
interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
  isDark: boolean;
}

// Create the theme context
const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

// Custom hook for using the theme context
export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

// Theme Provider component
export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, updateUserSettings, isAuthenticated } = useAuth();
  const [theme, setTheme] = useState<Theme>(() => {
    // Initialize theme from localStorage or user settings or system preference
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark' || savedTheme === 'light') {
      return savedTheme;
    }
    
    // If user is logged in, use their preference
    if (user?.settings?.darkMode !== undefined) {
      return user.settings.darkMode ? 'dark' : 'light';
    }
    
    // Otherwise, check system preference
    if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark';
    }
    
    return 'light';
  });
  
  // Apply the theme to the document
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    
    // Save theme to localStorage
    localStorage.setItem('theme', theme);
  }, [theme]);
  
  // Sync theme when user logs in or settings change dynamically
  useEffect(() => {
    if (isAuthenticated && user?.settings?.darkMode !== undefined) {
      const newTheme = user.settings.darkMode ? 'dark' : 'light';
      if (newTheme !== theme) {
        setTheme(newTheme);
      }
    }
  }, [isAuthenticated, user?.settings?.darkMode]);

  // Toggle theme function
  const toggleTheme = () => {
    const nextTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(nextTheme);
    
    // Explicitly update server on manual toggle, rather than relying on a race-prone useEffect
    if (isAuthenticated && user) {
      try {
        updateUserSettings({ darkMode: nextTheme === 'dark' });
      } catch (error) {
        console.error('Failed to update theme setting:', error);
      }
    }
  };
  
  // Context value
  const value = {
    theme,
    toggleTheme,
    isDark: theme === 'dark'
  };
  
  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};

export default ThemeContext; 