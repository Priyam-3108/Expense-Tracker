import React, { useState, useEffect, useRef } from 'react';
import {
    View, Text, TextInput, TouchableOpacity, StyleSheet,
    ScrollView, Modal, StatusBar, Switch, Platform,
    KeyboardAvoidingView, Animated
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import ModernDatePicker from '../components/ModernDatePicker';
import CustomAlert from '../components/CustomAlert';
import { categoryService } from '../services/categoryService';
import { useTheme } from '../context/ThemeContext';
import { offlineService } from '../services/offlineService';
import { syncEngine } from '../services/syncEngine';
import AsyncStorage from '@react-native-async-storage/async-storage';
import hapticFeedback from '../utils/haptics';

export default function AddExpenseScreen({ navigation, route }) {
    const { colors, isDark, shadows, borderRadius } = useTheme();
    const [description, setDescription] = useState('');
    const [amount, setAmount] = useState('');
    const [type, setType] = useState('expense');
    const [category, setCategory] = useState('');
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(false);
    const [pickerVisible, setPickerVisible] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editId, setEditId] = useState(null);
    const [date, setDate] = useState(new Date());
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [isRecurring, setIsRecurring] = useState(false);
    const [recurringPeriod, setRecurringPeriod] = useState('monthly');
    const [recurringEndDate, setRecurringEndDate] = useState(new Date());
    const [showEndDatePicker, setShowEndDatePicker] = useState(false);
    const [showAlert, setShowAlert] = useState(false);
    const [alertConfig, setAlertConfig] = useState({ type: 'default', title: '', message: '', buttons: [] });

    const typeAnim = useRef(new Animated.Value(type === 'expense' ? 0 : 1)).current;

    useEffect(() => {
        fetchCategories();
        if (route.params?.expense) {
            const exp = route.params.expense;
            setIsEditing(true);
            setEditId(exp._id);
            setDescription(exp.description || '');
            setAmount(exp.amount ? exp.amount.toString() : '');
            setType(exp.type || 'expense');
            setCategory(exp.category?._id || exp.category || '');
            setDate(new Date(exp.date));
            setIsRecurring(exp.isRecurring || false);
            if (exp.recurringPeriod) setRecurringPeriod(exp.recurringPeriod);
            if (exp.recurringEndDate) setRecurringEndDate(new Date(exp.recurringEndDate));
        } else {
            resetForm();
        }
    }, [route.params]);

    const resetForm = () => {
        setIsEditing(false); setEditId(null); setDescription(''); setAmount('');
        setType('expense'); setCategory(''); setDate(new Date());
        setIsRecurring(false); setRecurringPeriod('monthly'); setRecurringEndDate(new Date());
    };

    const switchType = (t) => {
        hapticFeedback.light();
        setType(t);
        Animated.spring(typeAnim, {
            toValue: t === 'expense' ? 0 : 1,
            useNativeDriver: false,
            tension: 60, friction: 8,
        }).start();
    };

    const fetchCategories = async () => {
        try {
            const res = await categoryService.getCategories();
            let cats = [];
            if (res.data.success) {
                if (res.data.data && Array.isArray(res.data.data.categories)) cats = res.data.data.categories;
                else if (Array.isArray(res.data.data)) cats = res.data.data;
            }
            if (cats.length > 0) {
                setCategories(cats);
                await AsyncStorage.setItem('categories_cache', JSON.stringify(cats));
            }
        } catch {
            try {
                const cached = await AsyncStorage.getItem('categories_cache');
                if (cached) setCategories(JSON.parse(cached));
            } catch { /* ignore */ }
        }
    };

    const handleSubmit = async () => {
        if (!amount || !category) {
            setAlertConfig({ type: 'warning', title: 'Missing Fields', message: 'Please enter an amount and select a category.', buttons: [{ text: 'OK', style: 'primary' }] });
            setShowAlert(true);
            return;
        }
        if (isRecurring && recurringEndDate < date) {
            setAlertConfig({ type: 'warning', title: 'Invalid Date', message: 'End date must be after start date.', buttons: [{ text: 'OK', style: 'primary' }] });
            setShowAlert(true);
            return;
        }

        setLoading(true);
        try {
            const fmt = (d) => {
                const y = d.getFullYear(), m = String(d.getMonth() + 1).padStart(2, '0'), day = String(d.getDate()).padStart(2, '0');
                return `${y}-${m}-${day}`;
            };
            const payload = {
                ...(isEditing && editId && { _id: editId, id: editId }),
                description, amount: parseFloat(amount), type, category,
                date: fmt(date), isRecurring,
                ...(isRecurring && { recurringPeriod, recurringEndDate: fmt(recurringEndDate) }),
            };

            await offlineService.saveExpenseLocally(payload);
            syncEngine.syncNow();

            hapticFeedback.success();
            setAlertConfig({
                type: 'success', title: isEditing ? 'Updated!' : 'Saved!',
                message: `Transaction ${isEditing ? 'updated' : 'saved'} successfully.`,
                buttons: [{ text: 'OK', style: 'primary', onPress: () => { resetForm(); navigation.setParams({ expense: undefined }); navigation.goBack(); } }],
            });
            setShowAlert(true);
        } catch (error) {
            hapticFeedback.error();
            setAlertConfig({ type: 'danger', title: 'Error', message: error.message || 'Failed to save.', buttons: [{ text: 'OK', style: 'primary' }] });
            setShowAlert(true);
        } finally {
            setLoading(false);
        }
    };

    const periods = [
        { label: 'Daily', value: 'daily', icon: 'sunny-outline' },
        { label: 'Weekly', value: 'weekly', icon: 'calendar-clear-outline' },
        { label: 'Monthly', value: 'monthly', icon: 'calendar-outline' },
        { label: 'Yearly', value: 'yearly', icon: 'stats-chart-outline' },
    ];

    const isExpense = type === 'expense';
    const typeColor = isExpense ? colors.danger : colors.success;
    const selectedCat = categories.find(c => c._id === category);
    const formattedDate = date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

    // ─── STYLES ───────────────────────────────────────────────────────────────
    const s = StyleSheet.create({
        outer: { flex: 1, backgroundColor: colors.background },
        scrollContent: { flexGrow: 1, paddingBottom: 100 },

        // ── Header ──
        header: {
            paddingTop: Platform.OS === 'ios' ? 54 : 44,
            paddingHorizontal: 20,
            paddingBottom: 12,
            flexDirection: 'row',
            alignItems: 'center',
            gap: 12,
        },
        backBtn: {
            width: 38, height: 38, borderRadius: 19,
            backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border,
            justifyContent: 'center', alignItems: 'center',
        },
        headerTitle: {
            fontSize: 20, fontWeight: '400', color: colors.text, letterSpacing: -0.3,
        },

        // ── Amount hero ──
        heroCard: {
            marginHorizontal: 16, marginBottom: 20, borderRadius: 20,
            overflow: 'hidden', ...shadows.lg,
        },
        heroGradient: { padding: 28, alignItems: 'center', justifyContent: 'center' },
        heroCurrencyLabel: { fontSize: 16, color: 'rgba(255,255,255,0.7)', fontWeight: '300', marginBottom: 4 },
        heroInput: {
            fontSize: 52, fontWeight: '200', color: '#ffffff',
            letterSpacing: -2, textAlign: 'center',
            fontVariant: ['tabular-nums'], minWidth: 120,
        },
        heroPlaceholder: { fontSize: 52, fontWeight: '200', color: 'rgba(255,255,255,0.35)', letterSpacing: -2 },
        heroDate: {
            marginTop: 12, flexDirection: 'row', alignItems: 'center', gap: 6,
            backgroundColor: 'rgba(255,255,255,0.15)', paddingHorizontal: 14, paddingVertical: 6,
            borderRadius: 9999, borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)',
        },
        heroDateText: { color: 'rgba(255,255,255,0.9)', fontSize: 13, fontWeight: '400' },

        // ── Type toggle ──
        typeToggle: {
            flexDirection: 'row', marginHorizontal: 16, marginBottom: 20,
            backgroundColor: colors.card, borderRadius: 16, padding: 4,
            borderWidth: 1, borderColor: colors.border, ...shadows.sm,
        },
        typeBtn: {
            flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
            gap: 7, paddingVertical: 13, borderRadius: 13,
        },
        typeBtnText: { fontSize: 15, fontWeight: '500', letterSpacing: -0.2 },

        // ── Section label ──
        sectionLabel: {
            fontSize: 11, fontWeight: '600', color: colors.subText,
            letterSpacing: 0.8, textTransform: 'uppercase',
            marginHorizontal: 20, marginBottom: 8,
        },

        // ── Category chips ──
        chipsScroll: { paddingHorizontal: 16, paddingBottom: 4 },
        chip: {
            flexDirection: 'row', alignItems: 'center', gap: 6,
            paddingHorizontal: 14, paddingVertical: 9,
            borderRadius: 9999, borderWidth: 1.5, marginRight: 8, marginBottom: 8,
        },
        chipDot: { width: 8, height: 8, borderRadius: 4 },
        chipText: { fontSize: 13, fontWeight: '400' },

        // ── Description ──
        inputWrapper: {
            marginHorizontal: 16, marginBottom: 16, borderRadius: 14,
            backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border,
            ...shadows.sm,
        },
        textInput: {
            padding: 16, fontSize: 15, fontWeight: '300',
            color: colors.text, minHeight: 52,
        },

        // ── Recurring ──
        recurringRow: {
            flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
            marginHorizontal: 16, marginBottom: 16, backgroundColor: colors.card,
            borderRadius: 14, padding: 16, borderWidth: 1, borderColor: colors.border,
            ...shadows.sm,
        },
        recurringLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
        recurringIcon: {
            width: 36, height: 36, borderRadius: 18,
            backgroundColor: colors.primarySubdued, justifyContent: 'center', alignItems: 'center',
        },
        recurringTitle: { fontSize: 15, fontWeight: '400', color: colors.text },
        recurringSubtitle: { fontSize: 12, color: colors.subText, marginTop: 1 },
        recurringCard: {
            marginHorizontal: 16, marginBottom: 16, backgroundColor: colors.card,
            borderRadius: 14, padding: 16, borderWidth: 1, borderColor: colors.border, ...shadows.sm,
        },
        periodRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12 },
        periodBtn: {
            flexDirection: 'row', alignItems: 'center', gap: 5,
            paddingHorizontal: 14, paddingVertical: 8,
            borderRadius: 9999, borderWidth: 1,
        },
        periodText: { fontSize: 13, fontWeight: '400' },

        // ── Date button ──
        dateTrigger: {
            marginHorizontal: 16, marginBottom: 16, backgroundColor: colors.card,
            borderRadius: 14, padding: 16, borderWidth: 1, borderColor: colors.border,
            flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
            ...shadows.sm,
        },
        dateTriggerLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
        dateIcon: {
            width: 36, height: 36, borderRadius: 18,
            backgroundColor: colors.primarySubdued, justifyContent: 'center', alignItems: 'center',
        },
        dateText: { fontSize: 15, fontWeight: '300', color: colors.text },
        dateLabel: { fontSize: 11, color: colors.subText, marginBottom: 1, fontWeight: '400' },

        // ── Submit ──
        submitWrapper: {
            position: 'absolute', bottom: 0, left: 0, right: 0,
            padding: 16, paddingBottom: Platform.OS === 'ios' ? 32 : 20,
            backgroundColor: colors.background,
            borderTopWidth: 1, borderTopColor: colors.border,
        },
        submitBtn: {
            borderRadius: 16, overflow: 'hidden', ...shadows.md,
        },
        submitGradient: {
            flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
            gap: 8, paddingVertical: 16,
        },
        submitText: { color: '#ffffff', fontSize: 16, fontWeight: '500', letterSpacing: -0.2 },

        // ── Category picker modal ──
        modalBg: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
        modalSheet: {
            backgroundColor: colors.card,
            borderTopLeftRadius: 24, borderTopRightRadius: 24,
            padding: 20, maxHeight: '65%',
        },
        modalHandle: {
            width: 40, height: 4, borderRadius: 2, backgroundColor: colors.border,
            alignSelf: 'center', marginBottom: 16,
        },
        modalTitle: { fontSize: 18, fontWeight: '400', color: colors.text, marginBottom: 12, letterSpacing: -0.3 },
        catOption: {
            flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
            paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: colors.borderLight,
        },
        catOptionLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
        catDot: { width: 14, height: 14, borderRadius: 7 },
        catOptionText: { fontSize: 15, fontWeight: '300', color: colors.text },
    });

    const submitGradient = isExpense
        ? [colors.dangerDark || '#c71852', colors.danger]
        : [colors.successDark || '#059669', colors.success];

    return (
        <KeyboardAvoidingView style={s.outer} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
            <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

            {/* Header */}
            <View style={s.header}>
                <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()}>
                    <Ionicons name="arrow-back" size={18} color={colors.text} />
                </TouchableOpacity>
                <Text style={s.headerTitle}>{isEditing ? 'Edit Transaction' : 'Add Transaction'}</Text>
            </View>

            <ScrollView contentContainerStyle={s.scrollContent} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">

                {/* ── Hero Amount Card ── */}
                <View style={s.heroCard}>
                    <LinearGradient
                        colors={isExpense
                            ? ['#2e0a1a', '#c71852', '#ea2261']
                            : ['#0a2e22', '#059669', '#10b981']}
                        start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                        style={s.heroGradient}
                    >
                        <Text style={s.heroCurrencyLabel}>Amount (₹)</Text>
                        <TextInput
                            style={s.heroInput}
                            placeholder="0"
                            placeholderTextColor="rgba(255,255,255,0.3)"
                            value={amount}
                            onChangeText={setAmount}
                            keyboardType="numeric"
                            returnKeyType="done"
                        />
                        <TouchableOpacity style={s.heroDate} onPress={() => setShowDatePicker(true)}>
                            <Ionicons name="calendar-outline" size={14} color="rgba(255,255,255,0.8)" />
                            <Text style={s.heroDateText}>{formattedDate}</Text>
                            <Ionicons name="chevron-down" size={12} color="rgba(255,255,255,0.6)" />
                        </TouchableOpacity>
                    </LinearGradient>
                </View>

                {/* Date Picker */}
                <ModernDatePicker
                    visible={showDatePicker}
                    selectedDate={date}
                    onDateSelect={setDate}
                    onClose={() => setShowDatePicker(false)}
                />

                {/* ── Type Toggle ── */}
                <View style={s.typeToggle}>
                    <TouchableOpacity
                        style={[s.typeBtn, isExpense && { backgroundColor: colors.dangerBg || '#fff0f5' }]}
                        onPress={() => switchType('expense')}
                    >
                        <Ionicons name="arrow-down-circle" size={20} color={isExpense ? colors.danger : colors.subText} />
                        <Text style={[s.typeBtnText, { color: isExpense ? colors.danger : colors.subText }]}>Expense</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[s.typeBtn, !isExpense && { backgroundColor: colors.successBg || '#ecfdf5' }]}
                        onPress={() => switchType('income')}
                    >
                        <Ionicons name="arrow-up-circle" size={20} color={!isExpense ? colors.success : colors.subText} />
                        <Text style={[s.typeBtnText, { color: !isExpense ? colors.success : colors.subText }]}>Income</Text>
                    </TouchableOpacity>
                </View>

                {/* ── Category Chips ── */}
                <Text style={s.sectionLabel}>Category</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.chipsScroll} style={{ marginBottom: 16 }}>
                    {categories.map(cat => {
                        const isSelected = category === cat._id;
                        const catColor = cat.color || colors.primary;
                        return (
                            <TouchableOpacity
                                key={cat._id}
                                style={[s.chip, {
                                    backgroundColor: isSelected ? catColor + '20' : colors.card,
                                    borderColor: isSelected ? catColor : colors.border,
                                }]}
                                onPress={() => { hapticFeedback.light(); setCategory(cat._id); }}
                            >
                                <View style={[s.chipDot, { backgroundColor: catColor }]} />
                                <Text style={[s.chipText, { color: isSelected ? catColor : colors.text }]}>{cat.name}</Text>
                                {isSelected && <Ionicons name="checkmark" size={13} color={catColor} />}
                            </TouchableOpacity>
                        );
                    })}
                </ScrollView>

                {/* ── Description ── */}
                <Text style={s.sectionLabel}>Notes (optional)</Text>
                <View style={s.inputWrapper}>
                    <TextInput
                        style={s.textInput}
                        placeholder="e.g. Grocery run, monthly salary..."
                        placeholderTextColor={colors.subText}
                        value={description}
                        onChangeText={setDescription}
                        multiline
                        maxLength={200}
                    />
                </View>

                {/* ── Recurring Toggle ── */}
                <TouchableOpacity style={s.recurringRow} onPress={() => setIsRecurring(v => !v)} activeOpacity={0.8}>
                    <View style={s.recurringLeft}>
                        <View style={s.recurringIcon}>
                            <Ionicons name="repeat" size={18} color={colors.primary} />
                        </View>
                        <View>
                            <Text style={s.recurringTitle}>Recurring</Text>
                            <Text style={s.recurringSubtitle}>{isRecurring ? `Repeats ${recurringPeriod}` : 'One-time transaction'}</Text>
                        </View>
                    </View>
                    <Switch
                        trackColor={{ false: colors.border, true: colors.primary }}
                        thumbColor="#ffffff"
                        onValueChange={v => setIsRecurring(v)}
                        value={isRecurring}
                    />
                </TouchableOpacity>

                {isRecurring && (
                    <View style={s.recurringCard}>
                        <Text style={[s.sectionLabel, { marginHorizontal: 0, marginBottom: 0 }]}>Frequency</Text>
                        <View style={s.periodRow}>
                            {periods.map(p => {
                                const isActive = recurringPeriod === p.value;
                                return (
                                    <TouchableOpacity
                                        key={p.value}
                                        style={[s.periodBtn, { backgroundColor: isActive ? colors.primary : colors.background, borderColor: isActive ? colors.primary : colors.border }]}
                                        onPress={() => { hapticFeedback.light(); setRecurringPeriod(p.value); }}
                                    >
                                        <Ionicons name={p.icon} size={13} color={isActive ? '#ffffff' : colors.subText} />
                                        <Text style={[s.periodText, { color: isActive ? '#ffffff' : colors.text }]}>{p.label}</Text>
                                    </TouchableOpacity>
                                );
                            })}
                        </View>

                        <Text style={[s.sectionLabel, { marginHorizontal: 0, marginTop: 16, marginBottom: 8 }]}>End Date</Text>
                        <TouchableOpacity style={[s.dateTrigger, { marginHorizontal: 0, marginBottom: 0 }]} onPress={() => setShowEndDatePicker(true)}>
                            <View style={s.dateTriggerLeft}>
                                <View style={s.dateIcon}>
                                    <Ionicons name="calendar-outline" size={16} color={colors.primary} />
                                </View>
                                <View>
                                    <Text style={s.dateLabel}>End Date</Text>
                                    <Text style={s.dateText}>{recurringEndDate.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</Text>
                                </View>
                            </View>
                            <Ionicons name="chevron-forward" size={16} color={colors.subText} />
                        </TouchableOpacity>
                        <ModernDatePicker
                            visible={showEndDatePicker}
                            selectedDate={recurringEndDate}
                            onDateSelect={setRecurringEndDate}
                            onClose={() => setShowEndDatePicker(false)}
                        />
                    </View>
                )}

                <View style={{ height: 90 }} />
            </ScrollView>

            {/* ── Fixed Submit Button ── */}
            <View style={s.submitWrapper}>
                <TouchableOpacity
                    style={[s.submitBtn, { opacity: loading ? 0.7 : 1 }]}
                    onPress={handleSubmit}
                    disabled={loading}
                    activeOpacity={0.85}
                >
                    <LinearGradient colors={submitGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={s.submitGradient}>
                        <Ionicons name={loading ? 'hourglass-outline' : (isEditing ? 'pencil' : 'checkmark-circle')} size={20} color="#ffffff" />
                        <Text style={s.submitText}>{loading ? 'Saving…' : (isEditing ? 'Update Transaction' : 'Save Transaction')}</Text>
                    </LinearGradient>
                </TouchableOpacity>
            </View>

            {/* Category Modal */}
            <Modal transparent visible={pickerVisible} animationType="slide" onRequestClose={() => setPickerVisible(false)}>
                <TouchableOpacity style={s.modalBg} activeOpacity={1} onPress={() => setPickerVisible(false)}>
                    <View style={s.modalSheet}>
                        <View style={s.modalHandle} />
                        <Text style={s.modalTitle}>Select Category</Text>
                        <ScrollView showsVerticalScrollIndicator={false}>
                            {categories.map(cat => (
                                <TouchableOpacity key={cat._id} style={s.catOption} onPress={() => { hapticFeedback.light(); setCategory(cat._id); setPickerVisible(false); }}>
                                    <View style={s.catOptionLeft}>
                                        <View style={[s.catDot, { backgroundColor: cat.color || colors.primary }]} />
                                        <Text style={s.catOptionText}>{cat.name}</Text>
                                    </View>
                                    {category === cat._id && <Ionicons name="checkmark-circle" size={20} color={colors.primary} />}
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    </View>
                </TouchableOpacity>
            </Modal>

            <CustomAlert visible={showAlert} type={alertConfig.type} title={alertConfig.title}
                message={alertConfig.message} buttons={alertConfig.buttons} onClose={() => setShowAlert(false)} />
        </KeyboardAvoidingView>
    );
}
