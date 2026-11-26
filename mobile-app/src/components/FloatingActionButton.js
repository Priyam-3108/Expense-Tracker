import React from 'react';
import { Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import hapticFeedback from '../utils/haptics';

// Primary action: a flat ink tile, a small press-down instead of a spring
function FloatingActionButton({ onPress, icon = 'add', style, accessibilityLabel = 'Add expense' }) {
    const { colors, shadows } = useTheme();

    return (
        <Pressable
            accessibilityRole="button"
            accessibilityLabel={accessibilityLabel}
            onPress={() => {
                hapticFeedback.medium();
                onPress && onPress();
            }}
            style={({ pressed }) => [
                styles.button,
                shadows.md,
                { backgroundColor: colors.ink, transform: [{ scale: pressed ? 0.97 : 1 }] },
                style,
            ]}
        >
            <Ionicons name={icon} size={24} color={colors.onInk} />
        </Pressable>
    );
}

const styles = StyleSheet.create({
    button: {
        position: 'absolute',
        bottom: 24,
        right: 16,
        zIndex: 999,
        width: 56,
        height: 56,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
    },
});

export default FloatingActionButton;
