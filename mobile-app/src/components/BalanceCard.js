import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import hapticFeedback from '../utils/haptics';

function BalanceCard({ balance = 0, onPress }) {
    const { isDark, borderRadius, shadows } = useTheme();
    const [isBalanceVisible, setIsBalanceVisible] = useState(true);

    const toggleBalanceVisibility = () => {
        hapticFeedback.light();
        setIsBalanceVisible(prev => !prev);
    };

    const formatNumber = (amount) =>
        new Intl.NumberFormat('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(amount);

    // Always a dark gradient so white text is always legible in both modes
    const gradientColors = isDark
        ? ['#1a1050', '#2e1b8a', '#533afd', '#7b68fe']   // deep navy-indigo → bright violet
        : ['#3730a3', '#533afd', '#6d5cff', '#9b8ffe'];   // rich indigo → soft violet (still dark, readable)

    return (
        <TouchableOpacity activeOpacity={0.92} onPress={onPress} style={styles.container}>
            <LinearGradient
                colors={gradientColors}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={[styles.gradient, { borderRadius: borderRadius.xl || 20 }, shadows.lg]}
            >
                {/* Decorative circles */}
                <View style={styles.circle1} />
                <View style={styles.circle2} />
                <View style={styles.circle3} />

                {/* Header */}
                <View style={styles.header}>
                    <View style={styles.badge}>
                        <View style={styles.liveDot} />
                        <Text style={styles.badgeText}>TOTAL BALANCE</Text>
                    </View>
                    <TouchableOpacity
                        onPress={toggleBalanceVisibility}
                        style={styles.eyeBtn}
                        hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                    >
                        <Ionicons
                            name={isBalanceVisible ? 'eye-outline' : 'eye-off-outline'}
                            size={19}
                            color="rgba(255,255,255,0.9)"
                        />
                    </TouchableOpacity>
                </View>

                {/* Amount */}
                <View style={styles.amountRow}>
                    <Text style={styles.currencySymbol}>₹</Text>
                    <Text style={styles.balance}>
                        {isBalanceVisible ? formatNumber(balance) : '••••••'}
                    </Text>
                </View>

                {/* Footer */}
                <View style={styles.footer}>
                    <View style={styles.footerLeft}>
                        <Ionicons name="wallet-outline" size={12} color="rgba(255,255,255,0.6)" />
                        <Text style={styles.footerText}>Spendly · Smart Finance</Text>
                    </View>
                    <View style={styles.trendBadge}>
                        <Ionicons name="trending-up" size={11} color="#10b981" />
                        <Text style={styles.trendText}>Live</Text>
                    </View>
                </View>
            </LinearGradient>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    container: { marginBottom: 16 },
    gradient: {
        paddingHorizontal: 22,
        paddingVertical: 20,
        minHeight: 170,
        justifyContent: 'space-between',
        overflow: 'hidden',
    },
    circle1: {
        position: 'absolute', width: 200, height: 200, borderRadius: 100,
        backgroundColor: 'rgba(255,255,255,0.05)', top: -70, right: -50,
    },
    circle2: {
        position: 'absolute', width: 140, height: 140, borderRadius: 70,
        backgroundColor: 'rgba(255,255,255,0.04)', bottom: -40, left: 10,
    },
    circle3: {
        position: 'absolute', width: 80, height: 80, borderRadius: 40,
        backgroundColor: 'rgba(255,255,255,0.06)', top: 30, right: 80,
    },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', zIndex: 1 },
    badge: {
        flexDirection: 'row', alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.15)',
        paddingHorizontal: 10, paddingVertical: 5, borderRadius: 9999,
        borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)',
    },
    liveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#10b981', marginRight: 6 },
    badgeText: { fontSize: 10, fontWeight: '600', color: '#ffffff', letterSpacing: 1 },
    eyeBtn: {
        backgroundColor: 'rgba(255,255,255,0.12)',
        borderRadius: 9999, padding: 7,
        borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)',
    },
    amountRow: { flexDirection: 'row', alignItems: 'flex-start', marginVertical: 12, zIndex: 1 },
    currencySymbol: { fontSize: 22, fontWeight: '300', color: 'rgba(255,255,255,0.75)', marginTop: 10, marginRight: 3 },
    balance: { fontSize: 44, fontWeight: '200', color: '#ffffff', letterSpacing: -1.5, fontVariant: ['tabular-nums'] },
    footer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', zIndex: 1 },
    footerLeft: { flexDirection: 'row', alignItems: 'center', gap: 5 },
    footerText: { fontSize: 11, color: 'rgba(255,255,255,0.55)', fontWeight: '300' },
    trendBadge: {
        flexDirection: 'row', alignItems: 'center', gap: 3,
        backgroundColor: 'rgba(16,185,129,0.18)',
        paddingHorizontal: 8, paddingVertical: 3, borderRadius: 9999,
        borderWidth: 1, borderColor: 'rgba(16,185,129,0.28)',
    },
    trendText: { fontSize: 10, fontWeight: '600', color: '#10b981', letterSpacing: 0.2 },
});

export default BalanceCard;
