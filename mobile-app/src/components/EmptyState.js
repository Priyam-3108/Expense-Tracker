import React from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
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
            width: 100,
            height: 100,
            borderRadius: 50,
            backgroundColor: colors.borderLight,
            justifyContent: 'center',
            alignItems: 'center',
            marginBottom: spacing.lg,
        },
        title: {
            fontSize: 20,
            fontWeight: '600',
            color: colors.text,
            marginBottom: spacing.sm,
            textAlign: 'center',
        },
        subtitle: {
            fontSize: 14,
            color: colors.subText,
            textAlign: 'center',
            marginBottom: spacing.lg,
        },
    });

    return (
        <View style={styles.container}>
            <View style={styles.iconContainer}>
                <Ionicons name={icon} size={48} color={colors.subText} />
            </View>
            <Text style={styles.title}>{title}</Text>
            <Text style={styles.subtitle}>{subtitle}</Text>
            {action}
        </View>
    );
}

export default EmptyState;
