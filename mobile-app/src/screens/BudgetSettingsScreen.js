import React, { useState, useCallback } from 'react';
import { View, Text, TextInput, StyleSheet, StatusBar, TouchableOpacity, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useTheme } from '../context/ThemeContext';
import { budgetService } from '../services/budgetService';
import ProgressBar from '../components/ProgressBar';
import hapticFeedback from '../utils/haptics';

function BudgetSettingsScreen({ navigation }) {
    const { colors, isDark } = useTheme();
    const [budget, setBudget] = useState(null); // the overall budget record from the server, or null if none set
    const [monthlyBudget, setMonthlyBudget] = useState('');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const fetchBudget = async () => {
        try {
            const res = await budgetService.getBudgets();
            if (res.data?.success) {
                const overall = (res.data.data.budgets || []).find(b => !b.category);
                setBudget(overall || null);
                if (overall) setMonthlyBudget(String(overall.amount));
            }
        } catch (e) {
            console.error('Budget fetch error:', e);
        } finally {
            setLoading(false);
        }
    };

    useFocusEffect(useCallback(() => { fetchBudget(); }, []));

    const handleSave = async () => {
        const amount = Number(monthlyBudget);
        if (!amount || amount <= 0) {
            Alert.alert('Invalid Amount', 'Please enter a valid budget amount.');
            return;
        }

        hapticFeedback.medium();
        setSaving(true);
        try {
            if (budget) {
                await budgetService.updateBudget(budget._id, { amount });
            } else {
                await budgetService.createBudget({ amount, category: null });
            }
            hapticFeedback.success();
            Alert.alert('Budget Saved', `Monthly budget updated to ₹${amount}`);
            fetchBudget();
        } catch (e) {
            hapticFeedback.error();
            Alert.alert('Error', e.response?.data?.message || 'Failed to save budget.');
        } finally {
            setSaving(false);
        }
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
        saveButtonDisabled: {
            opacity: 0.6,
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
                {loading ? (
                    <ActivityIndicator color={colors.primary} style={{ marginTop: 40 }} />
                ) : (
                    <>
                        {budget && budget.amount > 0 && (
                            <View style={styles.card}>
                                <ProgressBar
                                    label="This month"
                                    amount={budget.spent}
                                    budget={budget.amount}
                                    progress={budget.amount > 0 ? Math.min(budget.spent / budget.amount, 1) : 0}
                                />
                            </View>
                        )}

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
                                Set a spending limit to track how close you are to it. It resets automatically each new month.
                            </Text>
                        </View>

                        <TouchableOpacity
                            style={[styles.saveButton, saving && styles.saveButtonDisabled]}
                            onPress={handleSave}
                            disabled={saving}
                        >
                            <Text style={styles.saveButtonText}>{saving ? 'Saving...' : 'Save Budget Settings'}</Text>
                        </TouchableOpacity>
                    </>
                )}
            </ScrollView>
        </View>
    );
}

export default BudgetSettingsScreen;
