import React from 'react';
import { Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import Amount from './Amount';

// A stat is a number: label and figure, nothing added to fill it
function SummaryCard({ title, amount = 0, onPress }) {
    const { colors, borderRadius } = useTheme();

    return (
        <TouchableOpacity
            activeOpacity={0.85}
            onPress={onPress}
            disabled={!onPress}
            style={[styles.container, { backgroundColor: colors.card, borderColor: colors.border, borderRadius: borderRadius.lg }]}
        >
            <Text style={[styles.title, { color: colors.textSecondary }]}>{title}</Text>
            <Amount value={amount} currency="INR" style={[styles.amount, { color: colors.text }]} />
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, padding: 16, borderWidth: 1, marginBottom: 12 },
    title: { fontSize: 13, fontWeight: '400' },
    amount: { fontSize: 20, fontWeight: '500', marginTop: 8, fontVariant: ['tabular-nums'] },
});

export default SummaryCard;
