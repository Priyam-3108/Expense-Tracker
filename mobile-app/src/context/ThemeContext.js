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
        // ─── SURFACES ────────────────────────────────────────────────
        // Dark: true deep navy-black shells; Light: clean whites & soft canvas
        background:          isDark ? '#080c14' : '#f6f9fc',
        backgroundSecondary: isDark ? '#0f1623' : '#ffffff',
        card:                isDark ? '#141d2e' : '#ffffff',
        cardElevated:        isDark ? '#1a2438' : '#f8fafd',
        cardSecondary:       isDark ? '#1e2a3b' : '#f5e9d4', // canvas-cream in light

        // ─── TYPOGRAPHY ──────────────────────────────────────────────
        // Dark: high-contrast near-white; Light: deep navy ink
        text:           isDark ? '#f0f4ff' : '#0d253d',
        textSecondary:  isDark ? '#b8c8e8' : '#273951',
        subText:        isDark ? '#6b82a0' : '#64748d',
        textOnPrimary:  '#ffffff',

        // ─── BORDERS ─────────────────────────────────────────────────
        border:        isDark ? '#1e2d45' : '#e3e8ee',
        borderLight:   isDark ? '#162033' : '#f0f4f8',
        borderStrong:  isDark ? '#2d4060' : '#c8d5e3',
        inputBorder:   isDark ? '#2a3d58' : '#a8c3de',

        // ─── BRAND / CTA ─────────────────────────────────────────────
        primary:         '#533afd',
        primaryLight:    '#7b68fe',
        primaryDark:     '#4434d4',
        primaryPress:    '#2e2b8c',
        primarySubdued:  isDark ? '#2a2060' : '#ede8ff',
        primaryGlow:     isDark ? 'rgba(83,58,253,0.25)' : 'rgba(83,58,253,0.10)',

        brandDark900: '#1c1e54',

        // ─── ACCENTS ─────────────────────────────────────────────────
        secondary: isDark ? '#1c1e54' : '#1c1e54',
        accent:    '#ea2261',
        ruby:      '#ea2261',
        magenta:   '#f96bee',
        lemon:     '#c8860a',

        // ─── STATUS COLORS ───────────────────────────────────────────
        success:      '#10b981',
        successLight: '#34d399',
        successDark:  '#059669',
        successBg:    isDark ? '#0a2e22' : '#ecfdf5',

        danger:      '#ea2261',
        dangerLight: '#ff4d8d',
        dangerDark:  '#c71852',
        dangerBg:    isDark ? '#2e0a1a' : '#fff0f5',

        warning:      '#f59e0b',
        warningLight: '#fbbf24',
        warningDark:  '#d97706',
        warningBg:    isDark ? '#2e1f0a' : '#fffbeb',

        info:      '#533afd',
        infoLight: '#7b68fe',
        infoDark:  '#4434d4',
        infoBg:    isDark ? '#1a1640' : '#f0edff',

        // ─── INCOME / EXPENSE ────────────────────────────────────────
        income:     '#10b981',
        incomeBg:   isDark ? '#0a2e22' : '#ecfdf5',
        expense:    '#ea2261',
        expenseBg:  isDark ? '#2e0a1a' : '#fff0f5',

        // ─── CATEGORY PALETTE ────────────────────────────────────────
        categoryColors: {
            food:          '#f59e0b',
            transport:     '#533afd',
            shopping:      '#ec4899',
            entertainment: '#8b5cf6',
            health:        '#10b981',
            bills:         '#ea2261',
            education:     '#3b82f6',
            other:         '#64748b',
        },

        // ─── GRADIENTS ───────────────────────────────────────────────
        gradients: {
            primary:    ['#533afd', '#4434d4'],
            // Richer dark balance gradient: deep navy → electric indigo → midnight
            balanceDark: ['#0f1623', '#1c1e54', '#533afd', '#2a1a8a'],
            // Light balance: soft cream → magenta → indigo → deep navy  
            balanceLight: ['#e8e0ff', '#b9b9f9', '#533afd', '#1c1e54'],
            mesh:       ['#f5e9d4', '#f96bee', '#533afd', '#1c1e54'],
            income:     ['#059669', '#10b981'],
            expense:    ['#c71852', '#ea2261'],
            success:    ['#059669', '#10b981'],
            warning:    ['#d97706', '#f59e0b'],
            danger:     ['#c71852', '#ea2261'],
            purple:     ['#7c3aed', '#533afd'],
            blue:       ['#3b82f6', '#4434d4'],
            teal:       ['#0d9488', '#10b981'],
            darkCard:   ['#141d2e', '#1a2438'],
        },

        // ─── SHADOWS ─────────────────────────────────────────────────
        shadow:       isDark ? 'rgba(0,0,0,0.5)'          : 'rgba(0,55,112,0.08)',
        shadowMedium: isDark ? 'rgba(0,0,0,0.7)'          : 'rgba(0,55,112,0.12)',
        shadowHeavy:  isDark ? 'rgba(0,0,0,0.9)'          : 'rgba(0,55,112,0.22)',

        // ─── OVERLAY ─────────────────────────────────────────────────
        overlay:      isDark ? 'rgba(8,12,20,0.92)' : 'rgba(13,37,61,0.5)',
        overlayLight: isDark ? 'rgba(8,12,20,0.70)' : 'rgba(13,37,61,0.3)',
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

    // Border radius tokens matching DESIGN.md
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

    // Stripe Typographic Tokens (Sohne inspired weights & tracking)
    const typography = {
        displayXxl: { fontSize: 56, fontWeight: '300', letterSpacing: -1.4, lineHeight: 58 },
        displayXl: { fontSize: 48, fontWeight: '300', letterSpacing: -0.96, lineHeight: 52 },
        displayLg: { fontSize: 32, fontWeight: '300', letterSpacing: -0.64, lineHeight: 36 },
        displayMd: { fontSize: 26, fontWeight: '300', letterSpacing: -0.26, lineHeight: 30 },
        headingLg: { fontSize: 22, fontWeight: '300', letterSpacing: -0.22, lineHeight: 26 },
        headingMd: { fontSize: 20, fontWeight: '300', letterSpacing: -0.2, lineHeight: 26 },
        headingSm: { fontSize: 18, fontWeight: '300', letterSpacing: 0, lineHeight: 24 },
        bodyLg: { fontSize: 16, fontWeight: '300', lineHeight: 22 },
        bodyMd: { fontSize: 15, fontWeight: '300', lineHeight: 21 },
        bodyTabular: { fontSize: 14, fontWeight: '300', letterSpacing: -0.42, fontVariant: ['tabular-nums'] },
        buttonMd: { fontSize: 16, fontWeight: '400', lineHeight: 20 },
        buttonSm: { fontSize: 14, fontWeight: '400', lineHeight: 18 },
        caption: { fontSize: 13, fontWeight: '400', letterSpacing: -0.39, fontVariant: ['tabular-nums'] },
        microCap: { fontSize: 10, fontWeight: '400', letterSpacing: 0.1 },
    };

    // Stripe Elevation & Shadow styles
    const shadows = {
        sm: {
            shadowColor: '#003770',
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: isDark ? 0.3 : 0.08,
            shadowRadius: 3,
            elevation: 2,
        },
        md: {
            shadowColor: '#003770',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: isDark ? 0.4 : 0.1,
            shadowRadius: 12,
            elevation: 4,
        },
        lg: {
            shadowColor: '#003770',
            shadowOffset: { width: 0, height: 8 },
            shadowOpacity: isDark ? 0.5 : 0.14,
            shadowRadius: 24,
            elevation: 8,
        },
        xl: {
            shadowColor: '#003770',
            shadowOffset: { width: 0, height: 12 },
            shadowOpacity: isDark ? 0.6 : 0.2,
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
