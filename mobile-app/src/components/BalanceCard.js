import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import Amount from './Amount';

// The statement's final line: net balance, closed with the accountant's double rule
function BalanceCard({ balance = 0, onPress }) {
    const { colors, borderRadius } = useTheme();
    const negative = Number(balance) < 0;

    return (
        <TouchableOpacity
            activeOpacity={0.85}
            onPress={onPress}
            style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border, borderRadius: borderRadius.xl }]}
        >
            <Text style={[styles.label, { color: colors.textSecondary }]}>Net balance</Text>
            <View style={styles.figure}>
                <Amount
                    value={Math.abs(balance)}
                    sign={negative ? '−' : balance > 0 ? '+' : undefined}
                    currency="INR"
                    style={[styles.amount, { color: negative ? colors.danger : colors.text }]}
                />
                <View style={[styles.rule, { backgroundColor: colors.primary }]} />
                <View style={[styles.rule, styles.ruleSecond, { backgroundColor: colors.primary }]} />
            </View>
            <Text style={[styles.caption, { color: colors.subText }]}>Income minus expenses</Text>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    card: { padding: 20, borderWidth: 1, marginBottom: 12 },
    label: { fontSize: 14, fontWeight: '400' },
    figure: { alignSelf: 'flex-start', marginTop: 12 },
    amount: { fontSize: 40, fontWeight: '500', letterSpacing: -1, lineHeight: 46, fontVariant: ['tabular-nums'] },
    rule: { height: 1, opacity: 0.7, marginTop: 4 },
    ruleSecond: { marginTop: 2 },
    caption: { fontSize: 12, marginTop: 12 },
});

export default BalanceCard;
