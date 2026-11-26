import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import Amount from './Amount';

function BalanceCard({ balance = 0, onPress }) {
    const { isDark, borderRadius, shadows } = useTheme();

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
                </View>

                {/* Amount */}
                <View style={styles.amountRow}>
                    <Amount value={balance} currency="INR" style={styles.balance} />
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
    amountRow: { flexDirection: 'row', alignItems: 'flex-start', marginVertical: 12, zIndex: 1 },
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
