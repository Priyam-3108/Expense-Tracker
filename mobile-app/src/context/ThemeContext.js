import React, { createContext, useContext, useState, useEffect } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
    const systemScheme = useColorScheme();
    const [theme, setTheme] = useState(systemScheme);

    useEffect(() => {
        const loadTheme = async () => {
            const savedTheme = await AsyncStorage.getItem('theme');
            if (savedTheme) {
                setTheme(savedTheme);
            } else {
                setTheme(systemScheme);
            }
        };
        loadTheme();
    }, [systemScheme]);

    const toggleTheme = async (newTheme) => {
        setTheme(newTheme);
        await AsyncStorage.setItem('theme', newTheme);
    };

    const isDark = theme === 'dark';

    const colors = {
        background: isDark ? '#111827' : '#f8f9fa',
        card: isDark ? '#1f2937' : '#ffffff',
        text: isDark ? '#f9fafb' : '#111827',
        subText: isDark ? '#9ca3af' : '#6b7280',
        border: isDark ? '#374151' : '#e5e7eb',
        primary: '#4F46E5',
        danger: '#ef4444',
        success: '#10B981',
    };

    return (
        <ThemeContext.Provider value={{ theme, toggleTheme, isDark, colors }}>
            {children}
        </ThemeContext.Provider>
    );
};

export const useTheme = () => useContext(ThemeContext);
