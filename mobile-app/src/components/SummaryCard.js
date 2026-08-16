import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';

function SummaryCard({ title, amount = 0, icon, type = 'income', onPress }) {
    const { colors, borderRadius, shadows } = useTheme();

    const formatAmount = (amt) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(amt);
    };

    const isIncome = type === 'income';
    const iconName = icon || (isIncome ? 'trending-up' : 'trending-down');

    // Use distinct gradients for each type
    const gradientColors = isIncome
        ? ['#059669', '#10b981']
        : ['#c71852', '#ea2261'];
    const accentColor = isIncome ? colors.income : colors.expense;
    const bgColor    = isIncome ? (colors.incomeBg  || '#ecfdf5') : (colors.expenseBg || '#fff0f5');

    return (
        <TouchableOpacity
            activeOpacity={0.8}
            onPress={onPress}
            style={[
                styles.container,
                {
                    backgroundColor: colors.card,
                    borderColor: colors.border,
                    borderRadius: borderRadius.lg,
                },
                shadows.sm,
            ]}
        >
            {/* Top row: icon + badge */}
            <View style={styles.topRow}>
                <LinearGradient
                    colors={gradientColors}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.iconGradient}
                >
                    <Ionicons name={iconName} size={16} color="#ffffff" />
                </LinearGradient>

                <View style={[styles.badge, { backgroundColor: bgColor }]}>
                    <Text style={[styles.badgeText, { color: accentColor }]}>
                        {isIncome ? '↑ IN' : '↓ OUT'}
                    </Text>
                </View>
            </View>

            {/* Bottom: label + amount */}
            <View style={styles.bottom}>
                <Text style={[styles.title, { color: colors.subText }]}>{title}</Text>
                <Text style={[styles.amount, { color: colors.text }]}>
                    {formatAmount(amount)}
                </Text>
            </View>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 14,
        minHeight: 108,
        justifyContent: 'space-between',
        borderWidth: 1,
        marginBottom: 12,
    },
    topRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    iconGradient: {
        width: 34,
        height: 34,
        borderRadius: 17,
        justifyContent: 'center',
        alignItems: 'center',
    },
    badge: {
        paddingHorizontal: 7,
        paddingVertical: 3,
        borderRadius: 9999,
    },
    badgeText: {
        fontSize: 10,
        fontWeight: '600',
        letterSpacing: 0.2,
    },
    bottom: {
        gap: 2,
        marginTop: 10,
    },
    title: {
        fontSize: 12,
        fontWeight: '400',
        letterSpacing: -0.1,
    },
    amount: {
        fontSize: 19,
        fontWeight: '400',
        letterSpacing: -0.5,
        fontVariant: ['tabular-nums'],
    },
});

export default SummaryCard;
