import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';

function SummaryCard({
    title,
    amount = 0,
    icon,
    type = 'income', // 'income' or 'expense'
    onPress
}) {
    const { colors, spacing, borderRadius, shadows } = useTheme();

    const formatAmount = (amt) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(amt);
    };

    const gradientColors = type === 'income'
        ? ['#059669', '#10b981', '#34d399']
        : ['#dc2626', '#ef4444', '#f87171'];

    const iconName = icon || (type === 'income' ? 'trending-up' : 'trending-down');

    return (
        <TouchableOpacity
            activeOpacity={0.8}
            onPress={onPress}
            style={[styles.container, { flex: 1 }]}
        >
            <LinearGradient
                colors={gradientColors}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={[
                    styles.gradient,
                    { borderRadius: borderRadius.md },
                    shadows.md,
                ]}
            >
                <View style={styles.iconContainer}>
                    <Ionicons name={iconName} size={24} color="#ffffff" />
                </View>

                <View style={styles.content}>
                    <Text style={styles.title}>{title}</Text>
                    <Text style={styles.amount}>{formatAmount(amount)}</Text>
                </View>
            </LinearGradient>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    container: {
        marginBottom: 12,
    },
    gradient: {
        padding: 16,
        minHeight: 100,
        justifyContent: 'space-between',
    },
    iconContainer: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.2)',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 8,
    },
    content: {
        gap: 4,
    },
    title: {
        fontSize: 13,
        color: 'rgba(255,255,255,0.9)',
        fontWeight: '500',
        letterSpacing: 0.3,
    },
    amount: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#ffffff',
        letterSpacing: 0.5,
    },
});

export default SummaryCard;
