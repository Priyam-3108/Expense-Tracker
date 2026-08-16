import React, { useState, useEffect } from 'react';
import {
    View, Text, TextInput, TouchableOpacity, StyleSheet,
    ScrollView, StatusBar, Platform, KeyboardAvoidingView, Alert
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { debtService } from '../services/debtService';
import ModernDatePicker from '../components/ModernDatePicker';
import hapticFeedback from '../utils/haptics';

const fmtDate = (d) => {
    const y = d.getFullYear(), m = String(d.getMonth() + 1).padStart(2, '0'), day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
};
const displayDate = (d) => d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

export default function AddDebtScreen({ navigation, route }) {
    const { colors, isDark, shadows } = useTheme();
    const { debt, mode } = route.params || {}; // mode: 'add' | 'edit' | 'repay'
    const isEdit = mode === 'edit';
    const isRepay = mode === 'repay';

    // ── Form state ──
    const [personName, setPersonName] = useState('');
    const [amount, setAmount] = useState('');
    const [debtType, setDebtType] = useState('borrowed'); // 'borrowed' | 'lent'
    const [date, setDate] = useState(new Date());
    const [dueDate, setDueDate] = useState(null);
    const [notes, setNotes] = useState('');
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [showDueDatePicker, setShowDueDatePicker] = useState(false);
    const [loading, setLoading] = useState(false);

    // Repay state
    const [repayAmount, setRepayAmount] = useState('');
    const [repayNote, setRepayNote] = useState('');

    useEffect(() => {
        if (isEdit && debt) {
            setPersonName(debt.personName || '');
            setAmount(debt.amount?.toString() || '');
            setDebtType(debt.type || 'borrowed');
            setDate(debt.date ? new Date(debt.date) : new Date());
            setDueDate(debt.dueDate ? new Date(debt.dueDate) : null);
            setNotes(debt.notes || '');
        }
    }, [debt, mode]);

    const handleSave = async () => {
        if (!personName.trim()) {
            Alert.alert('Missing Info', 'Please enter the person\'s name.');
            return;
        }
        if (!amount || parseFloat(amount) <= 0) {
            Alert.alert('Missing Info', 'Please enter a valid amount.');
            return;
        }

        setLoading(true);
        try {
            const payload = {
                personName: personName.trim(),
                amount: parseFloat(amount),
                type: debtType,
                date: fmtDate(date),
                ...(dueDate && { dueDate: fmtDate(dueDate) }),
                ...(notes.trim() && { notes: notes.trim() }),
            };

            if (isEdit && debt?._id) {
                await debtService.updateDebt(debt._id, { personName: payload.personName, date: payload.date, dueDate: payload.dueDate, notes: payload.notes });
            } else {
                await debtService.createDebt(payload);
            }

            hapticFeedback.success();
            navigation.goBack();
        } catch (e) {
            hapticFeedback.error();
            Alert.alert('Error', e.response?.data?.message || 'Failed to save debt record.');
        } finally {
            setLoading(false);
        }
    };

    const handleRepay = async () => {
        const amt = parseFloat(repayAmount);
        if (!amt || amt <= 0) {
            Alert.alert('Invalid Amount', 'Please enter a valid payment amount.');
            return;
        }
        if (amt > (debt?.currentAmount || 0)) {
            Alert.alert('Too Much', `Payment cannot exceed remaining amount of ₹${debt?.currentAmount}.`);
            return;
        }

        setLoading(true);
        try {
            await debtService.addRepayment(debt._id, { amount: amt, date: fmtDate(date), note: repayNote.trim() });
            hapticFeedback.success();
            navigation.goBack();
        } catch (e) {
            hapticFeedback.error();
            Alert.alert('Error', e.response?.data?.message || 'Failed to record payment.');
        } finally {
            setLoading(false);
        }
    };

    const isBorrowed = debtType === 'borrowed';
    const typeColor = isBorrowed ? colors.danger : colors.success;

    const s = StyleSheet.create({
        outer: { flex: 1, backgroundColor: colors.background },
        content: { flexGrow: 1, paddingBottom: 100 },

        // Header
        header: {
            flexDirection: 'row', alignItems: 'center', gap: 12,
            paddingTop: Platform.OS === 'ios' ? 54 : 44,
            paddingHorizontal: 20, paddingBottom: 16,
        },
        backBtn: {
            width: 40, height: 40, borderRadius: 20,
            backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border,
            justifyContent: 'center', alignItems: 'center',
        },
        headerTitle: { fontSize: 20, fontWeight: '400', color: colors.text, letterSpacing: -0.3, flex: 1 },

        // Hero / repay card
        heroCard: { marginHorizontal: 16, marginBottom: 24, borderRadius: 20, overflow: 'hidden', ...shadows.lg },
        heroGradient: { padding: 28, alignItems: 'center' },
        heroLabel: { fontSize: 13, color: 'rgba(255,255,255,0.7)', fontWeight: '400', marginBottom: 8 },
        heroInput: {
            fontSize: 48, fontWeight: '200', color: '#ffffff', letterSpacing: -1.5,
            textAlign: 'center', fontVariant: ['tabular-nums'], minWidth: 120,
        },
        heroMeta: { fontSize: 12, color: 'rgba(255,255,255,0.6)', marginTop: 6 },

        // Type toggle
        typeToggle: {
            flexDirection: 'row', marginHorizontal: 16, marginBottom: 20,
            backgroundColor: colors.card, borderRadius: 16, padding: 4,
            borderWidth: 1, borderColor: colors.border, ...shadows.sm,
        },
        typeBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7, paddingVertical: 13, borderRadius: 13 },
        typeBtnText: { fontSize: 15, fontWeight: '500', letterSpacing: -0.2 },

        // Section label
        label: { fontSize: 11, fontWeight: '600', color: colors.subText, letterSpacing: 0.8, textTransform: 'uppercase', marginHorizontal: 20, marginBottom: 8 },

        // Input card
        inputCard: {
            marginHorizontal: 16, marginBottom: 14,
            backgroundColor: colors.card, borderRadius: 14,
            borderWidth: 1, borderColor: colors.border, ...shadows.sm,
        },
        textInput: { padding: 16, fontSize: 15, fontWeight: '300', color: colors.text },

        // Date row
        dateRow: {
            flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
            padding: 16,
        },
        dateLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
        dateIcon: {
            width: 36, height: 36, borderRadius: 18,
            backgroundColor: colors.primarySubdued, justifyContent: 'center', alignItems: 'center',
        },
        dateLabelText: { fontSize: 11, color: colors.subText, marginBottom: 1 },
        dateValueText: { fontSize: 15, fontWeight: '300', color: colors.text },

        // Note input
        noteInput: { padding: 16, fontSize: 14, fontWeight: '300', color: colors.text, minHeight: 70 },

        // Submit
        submitWrapper: {
            position: 'absolute', bottom: 0, left: 0, right: 0,
            padding: 16, paddingBottom: Platform.OS === 'ios' ? 32 : 20,
            backgroundColor: colors.background, borderTopWidth: 1, borderTopColor: colors.border,
        },
        submitBtn: { borderRadius: 16, overflow: 'hidden', ...shadows.md },
        submitGradient: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 16 },
        submitText: { color: '#ffffff', fontSize: 16, fontWeight: '500', letterSpacing: -0.2 },

        // Repay remaining info
        repayInfo: {
            marginHorizontal: 16, marginBottom: 16, padding: 14,
            backgroundColor: colors.successBg || '#ecfdf5', borderRadius: 14,
            borderWidth: 1, borderColor: colors.success + '30',
            flexDirection: 'row', alignItems: 'center', gap: 10,
        },
        repayInfoText: { flex: 1, fontSize: 13, color: colors.success, fontWeight: '400' },
    });

    const heroGradient = isRepay
        ? [colors.successDark || '#059669', colors.success]
        : isBorrowed ? [colors.dangerDark || '#c71852', colors.danger] : [colors.successDark || '#059669', colors.success];

    const title = isRepay ? 'Record Payment' : isEdit ? 'Edit Debt' : 'Add Debt';

    return (
        <KeyboardAvoidingView style={s.outer} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
            <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

            {/* Header */}
            <View style={s.header}>
                <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()}>
                    <Ionicons name="arrow-back" size={18} color={colors.text} />
                </TouchableOpacity>
                <Text style={s.headerTitle}>{title}</Text>
            </View>

            <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">

                {/* ── Hero Amount Card ── */}
                <View style={s.heroCard}>
                    <LinearGradient colors={heroGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={s.heroGradient}>
                        <Text style={s.heroLabel}>{isRepay ? 'Payment Amount (₹)' : 'Debt Amount (₹)'}</Text>
                        <TextInput
                            style={s.heroInput}
                            placeholder="0"
                            placeholderTextColor="rgba(255,255,255,0.3)"
                            value={isRepay ? repayAmount : amount}
                            onChangeText={isRepay ? setRepayAmount : setAmount}
                            keyboardType="numeric"
                            returnKeyType="done"
                            editable={!isEdit} // amount not editable in edit mode
                        />
                        {isRepay && debt && (
                            <Text style={s.heroMeta}>Remaining: ₹{debt.currentAmount?.toLocaleString('en-IN')}</Text>
                        )}
                    </LinearGradient>
                </View>

                {/* ── Repay info banner ── */}
                {isRepay && debt && (
                    <View style={s.repayInfo}>
                        <Ionicons name="information-circle-outline" size={20} color={colors.success} />
                        <Text style={s.repayInfoText}>
                            Recording payment for <Text style={{ fontWeight: '600' }}>{debt.personName}</Text>.
                            Original: ₹{debt.amount?.toLocaleString('en-IN')} · Paid: ₹{(debt.amount - debt.currentAmount)?.toLocaleString('en-IN')}.
                        </Text>
                    </View>
                )}

                {/* ── Type Toggle (hide in repay/edit mode) ── */}
                {!isRepay && !isEdit && (
                    <>
                        <View style={s.typeToggle}>
                            <TouchableOpacity
                                style={[s.typeBtn, isBorrowed && { backgroundColor: colors.dangerBg || '#fff0f5' }]}
                                onPress={() => { hapticFeedback.light(); setDebtType('borrowed'); }}
                            >
                                <Ionicons name="arrow-down-circle" size={20} color={isBorrowed ? colors.danger : colors.subText} />
                                <Text style={[s.typeBtnText, { color: isBorrowed ? colors.danger : colors.subText }]}>I Borrowed</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[s.typeBtn, !isBorrowed && { backgroundColor: colors.successBg || '#ecfdf5' }]}
                                onPress={() => { hapticFeedback.light(); setDebtType('lent'); }}
                            >
                                <Ionicons name="arrow-up-circle" size={20} color={!isBorrowed ? colors.success : colors.subText} />
                                <Text style={[s.typeBtnText, { color: !isBorrowed ? colors.success : colors.subText }]}>I Lent</Text>
                            </TouchableOpacity>
                        </View>
                    </>
                )}

                {/* ── Person Name ── */}
                {!isRepay && (
                    <>
                        <Text style={s.label}>Person Name</Text>
                        <View style={s.inputCard}>
                            <TextInput
                                style={s.textInput}
                                placeholder="e.g. Rahul, Mom, John..."
                                placeholderTextColor={colors.subText}
                                value={personName}
                                onChangeText={setPersonName}
                                autoCapitalize="words"
                            />
                        </View>
                    </>
                )}

                {/* ── Date ── */}
                <Text style={s.label}>{isRepay ? 'Payment Date' : 'Debt Date'}</Text>
                <TouchableOpacity style={[s.inputCard, { padding: 0 }]} onPress={() => setShowDatePicker(true)}>
                    <View style={s.dateRow}>
                        <View style={s.dateLeft}>
                            <View style={s.dateIcon}>
                                <Ionicons name="calendar-outline" size={16} color={colors.primary} />
                            </View>
                            <View>
                                <Text style={s.dateLabelText}>Date</Text>
                                <Text style={s.dateValueText}>{displayDate(date)}</Text>
                            </View>
                        </View>
                        <Ionicons name="chevron-forward" size={16} color={colors.subText} />
                    </View>
                </TouchableOpacity>
                <ModernDatePicker visible={showDatePicker} selectedDate={date} onDateSelect={setDate} onClose={() => setShowDatePicker(false)} />

                {/* ── Due Date (add/edit only) ── */}
                {!isRepay && (
                    <>
                        <Text style={s.label}>Due Date (optional)</Text>
                        <TouchableOpacity style={[s.inputCard, { padding: 0 }]} onPress={() => setShowDueDatePicker(true)}>
                            <View style={s.dateRow}>
                                <View style={s.dateLeft}>
                                    <View style={s.dateIcon}>
                                        <Ionicons name="alarm-outline" size={16} color={colors.warning} />
                                    </View>
                                    <View>
                                        <Text style={s.dateLabelText}>Due Date</Text>
                                        <Text style={s.dateValueText}>{dueDate ? displayDate(dueDate) : 'Not set'}</Text>
                                    </View>
                                </View>
                                <Ionicons name="chevron-forward" size={16} color={colors.subText} />
                            </View>
                        </TouchableOpacity>
                        <ModernDatePicker visible={showDueDatePicker} selectedDate={dueDate || new Date()} onDateSelect={(d) => setDueDate(d)} onClose={() => setShowDueDatePicker(false)} />
                    </>
                )}

                {/* ── Notes ── */}
                <Text style={s.label}>{isRepay ? 'Note (optional)' : 'Notes (optional)'}</Text>
                <View style={s.inputCard}>
                    <TextInput
                        style={s.noteInput}
                        placeholder={isRepay ? 'e.g. Paid via UPI...' : 'e.g. For rent, borrowed for trip...'}
                        placeholderTextColor={colors.subText}
                        value={isRepay ? repayNote : notes}
                        onChangeText={isRepay ? setRepayNote : setNotes}
                        multiline
                        maxLength={300}
                    />
                </View>

                <View style={{ height: 100 }} />
            </ScrollView>

            {/* ── Fixed Submit ── */}
            <View style={s.submitWrapper}>
                <TouchableOpacity
                    style={[s.submitBtn, { opacity: loading ? 0.7 : 1 }]}
                    onPress={isRepay ? handleRepay : handleSave}
                    disabled={loading}
                    activeOpacity={0.85}
                >
                    <LinearGradient
                        colors={isRepay
                            ? [colors.successDark || '#059669', colors.success]
                            : [colors.primaryDark || '#4434d4', colors.primary]}
                        start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                        style={s.submitGradient}
                    >
                        <Ionicons
                            name={loading ? 'hourglass-outline' : isRepay ? 'cash' : isEdit ? 'pencil' : 'checkmark-circle'}
                            size={20} color="#ffffff"
                        />
                        <Text style={s.submitText}>
                            {loading ? 'Saving…' : isRepay ? 'Record Payment' : isEdit ? 'Update Debt' : 'Save Debt'}
                        </Text>
                    </LinearGradient>
                </TouchableOpacity>
            </View>
        </KeyboardAvoidingView>
    );
}
