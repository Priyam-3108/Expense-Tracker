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
    const { colors, isDark, borderRadius, shadows } = useTheme();

    const getTypeColor = () => {
        switch (type) {
            case 'success':
                return colors.success;
            case 'warning':
                return colors.warning;
            case 'danger':
                return colors.danger;
            default:
                return colors.primary;
        }
    };

    const typeColor = getTypeColor();

    const styles = StyleSheet.create({
        container: {
            backgroundColor: isDark ? colors.card : '#f4f4f5',
            borderRadius: borderRadius.lg,
            padding: 16,
            marginBottom: 12,
            borderWidth: 1,
            borderColor: isDark ? colors.border : '#e5e5e5',
            ...shadows.sm,
        },
        header: {
            flexDirection: 'row',
            alignItems: 'center',
            marginBottom: 8,
        },
        iconContainer: {
            width: 32,
            height: 32,
            borderRadius: 16,
            backgroundColor: isDark ? `${typeColor}20` : '#ffffff',
            justifyContent: 'center',
            alignItems: 'center',
            marginRight: 10,
        },
        titleContainer: {
            flex: 1,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
        },
        title: {
            fontSize: 15,
            fontWeight: '400',
            color: '#171717',
            letterSpacing: -0.2,
        },
        message: {
            fontSize: 13,
            fontWeight: '400',
            color: '#525252',
            lineHeight: 19,
        },
        pillTag: {
            backgroundColor: colors.primarySubdued || '#fbf6ee',
            paddingHorizontal: 8,
            paddingVertical: 2,
            borderRadius: 8,
            marginLeft: 6,
        },
        pillTagText: {
            fontSize: 10,
            fontWeight: '500',
            color: colors.primaryDark || '#a8611c',
            letterSpacing: 0.1,
        },
    });

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <View style={styles.iconContainer}>
                    <Ionicons name={icon} size={18} color={typeColor} />
                </View>
                <View style={styles.titleContainer}>
                    <Text style={styles.title}>{title}</Text>
                    {trend ? (
                        <Ionicons
                            name={trend === 'up' ? 'trending-up' : 'trending-down'}
                            size={18}
                            color={trend === 'up' ? colors.success : colors.danger}
                        />
                    ) : (
                        <View style={styles.pillTag}>
                            <Text style={styles.pillTagText}>INSIGHT</Text>
                        </View>
                    )}
                </View>
            </View>
            <Text style={styles.message}>{message}</Text>
        </View>
    );
}

export default InsightCard;
