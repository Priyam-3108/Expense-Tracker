import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import hapticFeedback from '../utils/haptics';

function BalanceCard({ balance = 0, onPress }) {
    const { colors, isDark, spacing, borderRadius, shadows } = useTheme();
    const [isBalanceVisible, setIsBalanceVisible] = useState(true);

    const toggleBalanceVisibility = () => {
        hapticFeedback.light();
        setIsBalanceVisible(!isBalanceVisible);
    };

    const formatBalance = (amount) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(amount);
    };

    const gradientColors = isDark
        ? ['#312e81', '#581c87', '#831843']
        : ['#4F46E5', '#7C3AED', '#EC4899'];

    return (
        <TouchableOpacity
            activeOpacity={0.9}
            onPress={onPress}
            style={styles.container}
        >
            <LinearGradient
                colors={gradientColors}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={[
                    styles.gradient,
                    { borderRadius: borderRadius.lg },
                    shadows.lg,
                ]}
            >
                <View style={styles.header}>
                    <Text style={styles.label}>Total Balance</Text>
                    <TouchableOpacity onPress={toggleBalanceVisibility}>
                        <Ionicons
                            name={isBalanceVisible ? 'eye-outline' : 'eye-off-outline'}
                            size={20}
                            color="#ffffff"
                        />
                    </TouchableOpacity>
                </View>

                <View style={styles.balanceContainer}>
                    <Text style={styles.balance}>
                        {isBalanceVisible ? formatBalance(balance) : '₹ ••••••'}
                    </Text>
                </View>

                <View style={styles.footer}>
                    <Ionicons name="wallet-outline" size={16} color="rgba(255,255,255,0.8)" />
                    <Text style={styles.footerText}>Your current balance</Text>
                </View>
            </LinearGradient>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    container: {
        marginBottom: 16,
    },
    gradient: {
        padding: 20,
        minHeight: 160,
        justifyContent: 'space-between',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    label: {
        fontSize: 14,
        color: 'rgba(255,255,255,0.9)',
        fontWeight: '500',
        letterSpacing: 0.5,
    },
    balanceContainer: {
        marginVertical: 8,
    },
    balance: {
        fontSize: 36,
        fontWeight: 'bold',
        color: '#ffffff',
        letterSpacing: 1,
    },
    footer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    footerText: {
        fontSize: 12,
        color: 'rgba(255,255,255,0.8)',
        fontWeight: '400',
    },
});

export default BalanceCard;
