import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    loadTheme();
  }, []);

  const loadTheme = async () => {
    try {
      const savedTheme = await AsyncStorage.getItem('darkMode');
      if (savedTheme !== null) {
        setIsDarkMode(JSON.parse(savedTheme));
      }
    } catch (error) {
      console.error('Error loading theme:', error);
    }
  };

  const toggleDarkMode = async () => {
    try {
      const newMode = !isDarkMode;
      setIsDarkMode(newMode);
      await AsyncStorage.setItem('darkMode', JSON.stringify(newMode));
    } catch (error) {
      console.error('Error saving theme:', error);
    }
  };

  const theme = {
    isDarkMode,
    toggleDarkMode,
    colors: {
      // Background colors
      background: isDarkMode ? '#121212' : '#F8F9FA',
      surface: isDarkMode ? '#1E1E1E' : '#FFFFFF',
      card: isDarkMode ? '#2C2C2C' : '#FFFFFF',
      
      // Text colors
      text: isDarkMode ? '#FFFFFF' : '#1F2937',
      textSecondary: isDarkMode ? '#B3B3B3' : '#6B7280',
      
      // Primary colors (keep same for brand consistency)
      primary: '#10B981',
      primaryDark: '#059669',
      
      // Alert colors
      success: '#10B981',
      warning: '#F59E0B',
      danger: '#EF4444',
      info: '#3B82F6',
      
      // Border colors
      border: isDarkMode ? '#3C3C3C' : '#E5E7EB',
      borderLight: isDarkMode ? '#2C2C2C' : '#F3F4F6',
      
      // Other
      placeholder: isDarkMode ? '#666666' : '#9CA3AF',
      disabled: isDarkMode ? '#404040' : '#D1D5DB',
      overlay: isDarkMode ? 'rgba(0, 0, 0, 0.8)' : 'rgba(0, 0, 0, 0.5)',
      
      // Status bar
      statusBar: isDarkMode ? 'light-content' : 'dark-content',
    },
  };

  return (
    <ThemeContext.Provider value={theme}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
