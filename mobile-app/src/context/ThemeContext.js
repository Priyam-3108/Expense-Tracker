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

    // Graphite surfaces and one brass accent, matching the web client.
    // Keys are kept so every screen keeps working; only the values changed.
    const brass = isDark ? '#ad651e' : '#a8611c';
    const colors = {
        // Surfaces
        background:          isDark ? '#141415' : '#fafafa',
        backgroundSecondary: isDark ? '#0f0f10' : '#ffffff',
        card:                isDark ? '#19191b' : '#ffffff',
        cardElevated:        isDark ? '#232325' : '#f4f4f5',
        cardSecondary:       isDark ? '#232325' : '#f4f4f5',

        // Text: primary, secondary, muted
        text:           isDark ? '#ededed' : '#171717',
        textSecondary:  isDark ? '#a1a1a6' : '#525252',
        subText:        isDark ? '#85858b' : '#737373',
        textOnPrimary:  '#ffffff',

        // Hairlines
        border:        isDark ? 'rgba(237,237,237,0.08)' : 'rgba(23,23,23,0.08)',
        borderLight:   isDark ? 'rgba(237,237,237,0.05)' : 'rgba(23,23,23,0.05)',
        borderStrong:  isDark ? 'rgba(237,237,237,0.14)' : 'rgba(23,23,23,0.14)',
        inputBorder:   isDark ? 'rgba(237,237,237,0.12)' : 'rgba(23,23,23,0.16)',

        // Accent: brass, for the selection, the primary action and the key figure
        primary:         brass,
        primaryLight:    isDark ? '#d4954a' : '#c07a2e',
        primaryDark:     '#8a4d16',
        primaryPress:    '#8a4d16',
        primarySubdued:  isDark ? 'rgba(212,149,74,0.14)' : '#fbf6ee',
        primaryGlow:     'transparent',

        // Ink: the neutral fill where the accent would be too loud
        ink:        isDark ? '#ededed' : '#171717',
        onInk:      isDark ? '#171717' : '#fafafa',

        brandDark900: '#171717',
        secondary: isDark ? '#232325' : '#f4f4f5',
        accent:    brass,
        ruby:      isDark ? '#e5484d' : '#dc2626',
        magenta:   brass,
        lemon:     brass,

        // Semantic colours carry meaning only, toned to sit inside the palette
        success:      isDark ? '#4cc38a' : '#16a34a',
        successLight: isDark ? '#4cc38a' : '#22c55e',
        successDark:  isDark ? '#4cc38a' : '#15803d',
        successBg:    isDark ? 'rgba(76,195,138,0.12)' : '#f0fdf4',

        danger:      isDark ? '#e5484d' : '#dc2626',
        dangerLight: isDark ? '#e5484d' : '#ef4444',
        dangerDark:  isDark ? '#e5484d' : '#b91c1c',
        dangerBg:    isDark ? 'rgba(229,72,77,0.12)' : '#fef2f2',

        warning:      isDark ? '#d4954a' : '#b45309',
        warningLight: isDark ? '#d4954a' : '#d97706',
        warningDark:  isDark ? '#d4954a' : '#92400e',
        warningBg:    isDark ? 'rgba(212,149,74,0.12)' : '#fbf6ee',

        info:      isDark ? '#a1a1a6' : '#525252',
        infoLight: isDark ? '#a1a1a6' : '#737373',
        infoDark:  isDark ? '#ededed' : '#171717',
        infoBg:    isDark ? '#232325' : '#f4f4f5',

        // Money in and out: income green, spending stays ink
        income:     isDark ? '#4cc38a' : '#16a34a',
        incomeBg:   isDark ? 'rgba(76,195,138,0.12)' : '#f0fdf4',
        expense:    isDark ? '#ededed' : '#171717',
        expenseBg:  isDark ? '#232325' : '#f4f4f5',

        // Category fallbacks (real categories carry their own colour)
        categoryColors: {
            food:          '#d97706',
            transport:     '#2563eb',
            shopping:      '#db2777',
            entertainment: '#7c3aed',
            health:        '#16a34a',
            bills:         '#dc2626',
            education:     '#0891b2',
            other:         '#737373',
        },

        // Gradients are retired: each pair is one flat tone, so existing LinearGradient calls render solid
        gradients: {
            primary:      [brass, brass],
            balanceDark:  ['#19191b', '#19191b'],
            balanceLight: ['#ffffff', '#ffffff'],
            mesh:         [isDark ? '#141415' : '#fafafa', isDark ? '#141415' : '#fafafa'],
            income:       [isDark ? '#4cc38a' : '#16a34a', isDark ? '#4cc38a' : '#16a34a'],
            expense:      [isDark ? '#e5484d' : '#dc2626', isDark ? '#e5484d' : '#dc2626'],
            success:      [isDark ? '#4cc38a' : '#16a34a', isDark ? '#4cc38a' : '#16a34a'],
            warning:      [brass, brass],
            danger:       [isDark ? '#e5484d' : '#dc2626', isDark ? '#e5484d' : '#dc2626'],
            purple:       [brass, brass],
            blue:         [brass, brass],
            teal:         [brass, brass],
            darkCard:     ['#19191b', '#19191b'],
        },

        // Neutral shadows only
        shadow:       isDark ? 'rgba(0,0,0,0.4)' : 'rgba(0,0,0,0.05)',
        shadowMedium: isDark ? 'rgba(0,0,0,0.5)' : 'rgba(0,0,0,0.08)',
        shadowHeavy:  isDark ? 'rgba(0,0,0,0.6)' : 'rgba(0,0,0,0.12)',

        overlay:      isDark ? 'rgba(10,10,10,0.8)' : 'rgba(10,10,10,0.5)',
        overlayLight: isDark ? 'rgba(10,10,10,0.6)' : 'rgba(10,10,10,0.3)',
    };

    // Spacing tokens (base 8px)
    const spacing = {
        xxs: 2,
        xs: 4,
        sm: 8,
        md: 12,
        lg: 16,
        xl: 24,
        xxl: 32,
        huge: 64,
    };

    // Radius: controls 8-10, cards 12-16
    const borderRadius = {
        xs: 4,
        sm: 6,
        md: 8,
        lg: 12,
        xl: 16,
        xxl: 24,
        pill: 9999,
        full: 9999,
    };

    // Type scale: hierarchy from size and colour, weights 400 and 500, tight tracking only on display sizes
    const typography = {
        displayXxl: { fontSize: 56, fontWeight: '400', letterSpacing: -1.6, lineHeight: 60 },
        displayXl: { fontSize: 44, fontWeight: '400', letterSpacing: -1, lineHeight: 48 },
        displayLg: { fontSize: 32, fontWeight: '500', letterSpacing: -0.6, lineHeight: 36 },
        displayMd: { fontSize: 26, fontWeight: '500', letterSpacing: -0.3, lineHeight: 30 },
        headingLg: { fontSize: 22, fontWeight: '500', letterSpacing: -0.2, lineHeight: 28 },
        headingMd: { fontSize: 20, fontWeight: '500', lineHeight: 26 },
        headingSm: { fontSize: 17, fontWeight: '500', lineHeight: 22 },
        bodyLg: { fontSize: 16, fontWeight: '400', lineHeight: 22 },
        bodyMd: { fontSize: 15, fontWeight: '400', lineHeight: 21 },
        bodyTabular: { fontSize: 14, fontWeight: '400', fontVariant: ['tabular-nums'] },
        buttonMd: { fontSize: 16, fontWeight: '500', lineHeight: 20 },
        buttonSm: { fontSize: 14, fontWeight: '500', lineHeight: 18 },
        caption: { fontSize: 13, fontWeight: '400', fontVariant: ['tabular-nums'] },
        microCap: { fontSize: 12, fontWeight: '400' },
    };

    // Neutral elevation: soft on light, close to none on dark where depth comes from surface steps
    const shadows = {
        sm: {
            shadowColor: '#000000',
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: isDark ? 0 : 0.05,
            shadowRadius: 2,
            elevation: isDark ? 0 : 1,
        },
        md: {
            shadowColor: '#000000',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: isDark ? 0.2 : 0.06,
            shadowRadius: 12,
            elevation: 4,
        },
        lg: {
            shadowColor: '#000000',
            shadowOffset: { width: 0, height: 8 },
            shadowOpacity: isDark ? 0.3 : 0.08,
            shadowRadius: 24,
            elevation: 8,
        },
        xl: {
            shadowColor: '#000000',
            shadowOffset: { width: 0, height: 12 },
            shadowOpacity: isDark ? 0.35 : 0.12,
            shadowRadius: 32,
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
            typography,
            shadows,
            animations
        }}>
            {children}
        </ThemeContext.Provider>
    );
};

export const useTheme = () => useContext(ThemeContext);
