import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, StatusBar, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import hapticFeedback from '../utils/haptics';

function BudgetSettingsScreen({ navigation }) {
    const { colors, isDark } = useTheme();
    const [monthlyBudget, setMonthlyBudget] = useState('50000');

    const handleSave = () => {
        hapticFeedback.medium();
        Alert.alert('Budget Saved', `Monthly budget updated to ₹${monthlyBudget}`);
    };

    const styles = StyleSheet.create({
        container: {
            flex: 1,
            backgroundColor: colors.background,
            paddingHorizontal: 20,
            paddingTop: 50,
        },
        header: {
            flexDirection: 'row',
            alignItems: 'center',
            marginBottom: 24,
        },
        backButton: {
            width: 36,
            height: 36,
            borderRadius: 18,
            justifyContent: 'center',
            alignItems: 'center',
            marginRight: 12,
            backgroundColor: colors.card,
            borderWidth: 1,
            borderColor: colors.border,
        },
        title: {
            fontSize: 28,
            fontWeight: '300', // Sohne thin display
            color: colors.text,
            letterSpacing: -0.64,
        },
        card: {
            backgroundColor: colors.card,
            borderRadius: 12, // Stripe rounded.lg
            padding: 20,
            borderWidth: 1,
            borderColor: colors.border,
            marginBottom: 24,
        },
        label: {
            fontSize: 13,
            fontWeight: '400',
            color: colors.text,
            marginBottom: 8,
        },
        input: {
            borderWidth: 1,
            borderColor: colors.inputBorder || '#a8c3de',
            borderRadius: 6, // Stripe text-input (6px)
            paddingHorizontal: 14,
            paddingVertical: 12,
            fontSize: 16,
            fontWeight: '300',
            color: colors.text,
            fontVariant: ['tabular-nums'],
            marginBottom: 16,
        },
        hint: {
            fontSize: 12,
            fontWeight: '300',
            color: colors.subText,
            lineHeight: 18,
        },
        saveButton: {
            backgroundColor: colors.primary || '#533afd',
            paddingVertical: 12,
            paddingHorizontal: 20,
            borderRadius: 9999, // Stripe button-primary-pill
            alignItems: 'center',
            marginTop: 10,
        },
        saveButtonText: {
            color: '#ffffff',
            fontSize: 15,
            fontWeight: '400',
        },
    });

    return (
        <View style={styles.container}>
            <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
            <View style={styles.header}>
                <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
                    <Ionicons name="arrow-back" size={20} color={colors.text} />
                </TouchableOpacity>
                <Text style={styles.title}>Budget Settings</Text>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
                <View style={styles.card}>
                    <Text style={styles.label}>Monthly Overall Budget (₹)</Text>
                    <TextInput
                        style={styles.input}
                        value={monthlyBudget}
                        onChangeText={setMonthlyBudget}
                        keyboardType="numeric"
                        placeholder="Enter monthly budget"
                        placeholderTextColor={colors.subText}
                    />
                    <Text style={styles.hint}>
                        Set a spending limit to trigger budget alert warnings when your expenses reach 80% and 100% of your threshold.
                    </Text>
                </View>

                <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
                    <Text style={styles.saveButtonText}>Save Budget Settings</Text>
                </TouchableOpacity>
            </ScrollView>
        </View>
    );
}

export default BudgetSettingsScreen;
