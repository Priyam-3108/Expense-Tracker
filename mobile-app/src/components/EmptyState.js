import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';

function EmptyState({
    icon = 'document-text-outline',
    title = 'No data found',
    subtitle = 'Start by adding your first item',
    action
}) {
    const { colors, spacing } = useTheme();

    const styles = StyleSheet.create({
        container: {
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center',
            paddingHorizontal: spacing.xl,
            paddingVertical: spacing.xxl,
        },
        iconContainer: {
            width: 80,
            height: 80,
            borderRadius: 40,
            backgroundColor: `${colors.primary}12`,
            justifyContent: 'center',
            alignItems: 'center',
            marginBottom: spacing.lg,
            borderWidth: 1,
            borderColor: `${colors.primary}25`,
        },
        title: {
            fontSize: 22,
            fontWeight: '300', // Sohne thin style
            color: colors.text,
            marginBottom: spacing.xs,
            textAlign: 'center',
            letterSpacing: -0.26,
        },
        subtitle: {
            fontSize: 14,
            fontWeight: '300',
            color: colors.subText,
            textAlign: 'center',
            marginBottom: spacing.lg,
            lineHeight: 20,
        },
    });

    return (
        <View style={styles.container}>
            <View style={styles.iconContainer}>
                <Ionicons name={icon} size={36} color={colors.primary} />
            </View>
            <Text style={styles.title}>{title}</Text>
            <Text style={styles.subtitle}>{subtitle}</Text>
            {action}
        </View>
    );
}

export default EmptyState;
