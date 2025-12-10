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
        // Base colors
        background: isDark ? '#0f172a' : '#f8fafc',
        backgroundSecondary: isDark ? '#1e293b' : '#f1f5f9',
        card: isDark ? '#1e293b' : '#ffffff',
        cardSecondary: isDark ? '#334155' : '#f8fafc',
        text: isDark ? '#f1f5f9' : '#0f172a',
        textSecondary: isDark ? '#cbd5e1' : '#475569',
        subText: isDark ? '#94a3b8' : '#64748b',
        border: isDark ? '#334155' : '#e2e8f0',
        borderLight: isDark ? '#1e293b' : '#f1f5f9',

        // Primary colors
        primary: '#6366f1',
        primaryLight: '#818cf8',
        primaryDark: '#4f46e5',

        // Accent colors
        secondary: '#8b5cf6',
        accent: '#ec4899',

        // Status colors
        success: '#10b981',
        successLight: '#34d399',
        successDark: '#059669',
        danger: '#ef4444',
        dangerLight: '#f87171',
        dangerDark: '#dc2626',
        warning: '#f59e0b',
        warningLight: '#fbbf24',
        warningDark: '#d97706',
        info: '#3b82f6',
        infoLight: '#60a5fa',
        infoDark: '#2563eb',

        // Income/Expense colors
        income: '#10b981',
        expense: '#ef4444',

        // Category colors
        categoryColors: {
            food: '#f59e0b',
            transport: '#3b82f6',
            shopping: '#ec4899',
            entertainment: '#8b5cf6',
            health: '#10b981',
            bills: '#ef4444',
            education: '#6366f1',
            other: '#64748b',
        },

        // Gradient colors
        gradients: {
            primary: ['#6366f1', '#8b5cf6'],
            balance: isDark ? ['#312e81', '#581c87', '#831843'] : ['#4F46E5', '#7C3AED', '#EC4899'],
            income: ['#059669', '#10b981', '#34d399'],
            expense: ['#dc2626', '#ef4444', '#f87171'],
            success: ['#059669', '#10b981'],
            warning: ['#d97706', '#f59e0b'],
            danger: ['#dc2626', '#ef4444'],
            purple: ['#7c3aed', '#a78bfa'],
            blue: ['#2563eb', '#60a5fa'],
            teal: ['#0d9488', '#14b8a6'],
            orange: ['#ea580c', '#f97316'],
        },

        // Shadow colors
        shadow: isDark ? 'rgba(0, 0, 0, 0.5)' : 'rgba(0, 0, 0, 0.1)',
        shadowMedium: isDark ? 'rgba(0, 0, 0, 0.6)' : 'rgba(0, 0, 0, 0.15)',
        shadowHeavy: isDark ? 'rgba(0, 0, 0, 0.8)' : 'rgba(0, 0, 0, 0.25)',

        // Overlay colors
        overlay: isDark ? 'rgba(0, 0, 0, 0.7)' : 'rgba(0, 0, 0, 0.5)',
        overlayLight: isDark ? 'rgba(0, 0, 0, 0.5)' : 'rgba(0, 0, 0, 0.3)',
    };

    // Spacing tokens
    const spacing = {
        xs: 4,
        sm: 8,
        md: 16,
        lg: 24,
        xl: 32,
        xxl: 48,
    };

    // Border radius tokens
    const borderRadius = {
        sm: 8,
        md: 12,
        lg: 16,
        xl: 20,
        xxl: 24,
        full: 9999,
    };

    // Shadow styles
    const shadows = {
        sm: {
            shadowColor: colors.shadow,
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 1,
            shadowRadius: 2,
            elevation: 2,
        },
        md: {
            shadowColor: colors.shadow,
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 1,
            shadowRadius: 4,
            elevation: 4,
        },
        lg: {
            shadowColor: colors.shadow,
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 1,
            shadowRadius: 8,
            elevation: 8,
        },
        xl: {
            shadowColor: colors.shadowHeavy,
            shadowOffset: { width: 0, height: 8 },
            shadowOpacity: 1,
            shadowRadius: 16,
            elevation: 12,
        },
    };

    // Animation timings
    const animations = {
        fast: 200,
        normal: 300,
        slow: 500,
    };

    return (
        <ThemeContext.Provider value={{
            theme,
            toggleTheme,
            isDark,
            colors,
            spacing,
            borderRadius,
            shadows,
            animations
        }}>
            {children}
        </ThemeContext.Provider>
    );
};

export const useTheme = () => useContext(ThemeContext);
