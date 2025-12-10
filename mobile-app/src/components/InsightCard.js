import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';

function InsightCard({
    icon = 'bulb-outline',
    title,
    message,
    type = 'info', // 'info', 'success', 'warning', 'danger'
    trend // 'up', 'down', or null
}) {
    const { colors, spacing, borderRadius, shadows } = useTheme();

    const getTypeColor = () => {
        switch (type) {
            case 'success':
                return colors.success;
            case 'warning':
                return colors.warning;
            case 'danger':
                return colors.danger;
            default:
                return colors.info;
        }
    };

    const typeColor = getTypeColor();

    const styles = StyleSheet.create({
        container: {
            backgroundColor: colors.card,
            borderRadius: borderRadius.md,
            padding: spacing.md,
            marginBottom: spacing.md,
            borderLeftWidth: 4,
            borderLeftColor: typeColor,
            ...shadows.sm,
        },
        header: {
            flexDirection: 'row',
            alignItems: 'center',
            marginBottom: spacing.sm,
        },
        iconContainer: {
            width: 36,
            height: 36,
            borderRadius: 18,
            backgroundColor: `${typeColor}20`,
            justifyContent: 'center',
            alignItems: 'center',
            marginRight: spacing.sm,
        },
        titleContainer: {
            flex: 1,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
        },
        title: {
            fontSize: 15,
            fontWeight: '600',
            color: colors.text,
        },
        message: {
            fontSize: 14,
            color: colors.subText,
            lineHeight: 20,
        },
        trendIcon: {
            marginLeft: spacing.sm,
        },
    });

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <View style={styles.iconContainer}>
                    <Ionicons name={icon} size={20} color={typeColor} />
                </View>
                <View style={styles.titleContainer}>
                    <Text style={styles.title}>{title}</Text>
                    {trend && (
                        <Ionicons
                            name={trend === 'up' ? 'trending-up' : 'trending-down'}
                            size={20}
                            color={trend === 'up' ? colors.success : colors.danger}
                            style={styles.trendIcon}
                        />
                    )}
                </View>
            </View>
            <Text style={styles.message}>{message}</Text>
        </View>
    );
}

export default InsightCard;
