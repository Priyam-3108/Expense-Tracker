import React from 'react';
import { View, Text, Switch, StyleSheet } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import Amount from './Amount';
import hapticFeedback from '../utils/haptics';

// Row with the "exclude savings" switch; `leftOut` is the amount currently taken out of spending
function SavingsToggle({ value, onChange, leftOut = 0 }) {
    const { colors } = useTheme();
    return (
        <View style={[styles.row, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={{ flex: 1 }}>
                <Text style={[styles.label, { color: colors.text }]}>Exclude savings and investments</Text>
                {value && leftOut > 0 ? (
                    <Text style={[styles.note, { color: colors.subText }]}>
                        <Amount value={leftOut} style={{ color: colors.subText }} /> left out of spending
                    </Text>
                ) : null}
            </View>
            <Switch
                value={value}
                onValueChange={(v) => { hapticFeedback.light(); onChange(v); }}
                trackColor={{ false: colors.borderStrong, true: colors.primary }}
                thumbColor="#ffffff"
                accessibilityLabel="Exclude savings and investments"
            />
        </View>
    );
}

const styles = StyleSheet.create({
    row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 10, borderWidth: 1, borderRadius: 12, marginBottom: 12 },
    label: { fontSize: 14, fontWeight: '400' },
    note: { fontSize: 12, marginTop: 2 },
});

export default SavingsToggle;
