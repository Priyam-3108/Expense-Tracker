import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Modal, StatusBar, Switch } from 'react-native';
import ModernDatePicker from '../components/ModernDatePicker';
import CustomAlert from '../components/CustomAlert';
import { expenseService } from '../services/expenseService';
import { categoryService } from '../services/categoryService';
import { useTheme } from '../context/ThemeContext';

export default function AddExpenseScreen({ navigation, route }) {
    const { colors, isDark } = useTheme();
    const [description, setDescription] = useState('');
    const [amount, setAmount] = useState('');
    const [type, setType] = useState('expense'); // 'expense' or 'income'
    const [category, setCategory] = useState('');
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(false);
    const [pickerVisible, setPickerVisible] = useState(false);

    // Editing State
    const [isEditing, setIsEditing] = useState(false);
    const [editId, setEditId] = useState(null);

    // Date State
    const [date, setDate] = useState(new Date());
    const [showDatePicker, setShowDatePicker] = useState(false);

    // Recurring State
    const [isRecurring, setIsRecurring] = useState(false);
    const [recurringPeriod, setRecurringPeriod] = useState('monthly');
    const [recurringEndDate, setRecurringEndDate] = useState(new Date());
    const [showEndDatePicker, setShowEndDatePicker] = useState(false);

    // Alert States
    const [showAlert, setShowAlert] = useState(false);
    const [alertConfig, setAlertConfig] = useState({ type: 'default', title: '', message: '', buttons: [] });

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
        }
    }, [route.params]);

    const fetchCategories = async () => {
        try {
            const res = await categoryService.getCategories();
            // Check for nested structure commonly used in this project's backend
            if (res.data.success) {
                if (res.data.data && Array.isArray(res.data.data.categories)) {
                    setCategories(res.data.data.categories);
                } else if (Array.isArray(res.data.data)) {
                    setCategories(res.data.data);
                } else {
                    console.warn('Unexpected category response structure:', res.data);
                    setCategories([]);
                }
            }
        } catch (error) {
            console.error('Failed to load categories', error);
            setAlertConfig({
                type: 'danger',
                title: 'Error',
                message: 'Failed to load categories',
                buttons: [{ text: 'OK', style: 'primary' }]
            });
            setShowAlert(true);
        }
    };

    const handleSubmit = async () => {
        if (!amount || !category) {
            setAlertConfig({
                type: 'warning',
                title: 'Missing Information',
                message: 'Please fill amount and category fields',
                buttons: [{ text: 'OK', style: 'primary' }]
            });
            setShowAlert(true);
            return;
        }

        if (isRecurring && recurringEndDate < date) {
            setAlertConfig({
                type: 'warning',
                title: 'Invalid Date',
                message: 'Recurring end date must be after the start date',
                buttons: [{ text: 'OK', style: 'primary' }]
            });
            setShowAlert(true);
            return;
        }

        setLoading(true);
        try {
            const payload = {
                description: description,
                amount: parseFloat(amount),
                type,
                category,
                date: date.toISOString(), // Send selected date
                isRecurring,
                ...(isRecurring && {
                    recurringPeriod,
                    recurringEndDate: recurringEndDate.toISOString()
                })
            };

            if (isEditing) {
                await expenseService.updateExpense(editId, payload);
                setAlertConfig({
                    type: 'success',
                    title: 'Success',
                    message: 'Transaction updated successfully!',
                    buttons: [{
                        text: 'OK',
                        style: 'primary',
                        onPress: () => navigation.goBack()
                    }]
                });
            } else {
                await expenseService.createExpense(payload);
                setAlertConfig({
                    type: 'success',
                    title: 'Success',
                    message: 'Transaction added successfully!',
                    buttons: [{
                        text: 'OK',
                        style: 'primary',
                        onPress: () => navigation.goBack()
                    }]
                });
            }
            setShowAlert(true);
        } catch (error) {
            const msg = error.response?.data?.message || (isEditing ? 'Failed to update transaction' : 'Failed to add transaction');
            setAlertConfig({
                type: 'danger',
                title: 'Error',
                message: msg,
                buttons: [{ text: 'OK', style: 'primary' }]
            });
            setShowAlert(true);
        } finally {
            setLoading(false);
        }
    };

    const periods = [
        { label: 'Daily', value: 'daily' },
        { label: 'Weekly', value: 'weekly' },
        { label: 'Monthly', value: 'monthly' },
        { label: 'Yearly', value: 'yearly' }
    ];

    return (
        <ScrollView contentContainerStyle={[styles.container, { backgroundColor: colors.background }]}>
            <StatusBar barStyle={isDark ? "light-content" : "dark-content"} backgroundColor={colors.background} />

            <View style={styles.header}>
                <Text style={[styles.headerTitle, { color: colors.text }]}>{isEditing ? 'Edit Transaction' : 'Add Transaction'}</Text>
            </View>

            <View style={[styles.typeContainer, { borderColor: colors.primary }]}>
                <TouchableOpacity
                    style={[styles.typeButton, type === 'expense' && { backgroundColor: colors.primary }, { borderTopLeftRadius: 10, borderBottomLeftRadius: 10 }]}
                    onPress={() => setType('expense')}
                >
                    <Text style={[styles.typeText, { color: type === 'expense' ? 'white' : colors.primary }]}>Expense</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.typeButton, type === 'income' && { backgroundColor: colors.primary }, { borderTopRightRadius: 10, borderBottomRightRadius: 10 }]}
                    onPress={() => setType('income')}
                >
                    <Text style={[styles.typeText, { color: type === 'income' ? 'white' : colors.primary }]}>Income</Text>
                </TouchableOpacity>
            </View>

            {/* Date Selection */}
            <Text style={[styles.label, { color: colors.subText }]}>Date</Text>
            <TouchableOpacity
                style={[styles.input, styles.dateInput, { backgroundColor: colors.card, borderColor: colors.border }]}
                onPress={() => setShowDatePicker(true)}
            >
                <Text style={{ color: colors.text, fontSize: 16 }}>{date.toLocaleDateString()}</Text>
            </TouchableOpacity>
            <ModernDatePicker
                visible={showDatePicker}
                selectedDate={date}
                onDateSelect={(selectedDate) => setDate(selectedDate)}
                onClose={() => setShowDatePicker(false)}
            />

            <Text style={[styles.label, { color: colors.subText }]}>Description (Optional)</Text>
            <TextInput
                style={[styles.input, { backgroundColor: colors.card, color: colors.text, borderColor: colors.border }]}
                placeholder="e.g. Grocery, Salary"
                placeholderTextColor={colors.subText}
                value={description}
                onChangeText={setDescription}
            />

            <Text style={[styles.label, { color: colors.subText }]}>Amount</Text>
            <TextInput
                style={[styles.input, { backgroundColor: colors.card, color: colors.text, borderColor: colors.border }]}
                placeholder="0.00"
                placeholderTextColor={colors.subText}
                value={amount}
                onChangeText={setAmount}
                keyboardType="numeric"
            />

            <Text style={[styles.label, { color: colors.subText }]}>Category</Text>
            <TouchableOpacity
                style={[styles.pickerTrigger, { backgroundColor: colors.card, borderColor: colors.border }]}
                onPress={() => setPickerVisible(true)}
            >
                <Text style={{ color: category ? colors.text : colors.subText, fontSize: 16 }}>
                    {category ? categories.find(c => c._id === category)?.name : 'Select Category'}
                </Text>
                <Text style={{ color: colors.subText }}>▼</Text>
            </TouchableOpacity>

            {/* Recurring Toggle */}
            <View style={[styles.row, { marginBottom: 20, justifyContent: 'space-between', alignItems: 'center' }]}>
                <Text style={[styles.label, { color: colors.text, marginBottom: 0 }]}>Recursive Transaction?</Text>
                <Switch
                    trackColor={{ false: "#767577", true: colors.primary }}
                    thumbColor={isRecurring ? "#f4f3f4" : "#f4f3f4"}
                    onValueChange={setIsRecurring}
                    value={isRecurring}
                />
            </View>

            {isRecurring && (
                <View style={[styles.recurringContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
                    <Text style={[styles.label, { color: colors.subText, marginTop: 10 }]}>Frequency</Text>
                    <View style={styles.periodContainer}>
                        {periods.map(p => (
                            <TouchableOpacity
                                key={p.value}
                                style={[
                                    styles.periodButton,
                                    recurringPeriod === p.value && { backgroundColor: colors.primary, borderColor: colors.primary },
                                    { borderColor: colors.border }
                                ]}
                                onPress={() => setRecurringPeriod(p.value)}
                            >
                                <Text style={[
                                    styles.periodText,
                                    { color: recurringPeriod === p.value ? 'white' : colors.text }
                                ]}>{p.label}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>

                    <Text style={[styles.label, { color: colors.subText }]}>End Date</Text>
                    <TouchableOpacity
                        style={[styles.input, styles.dateInput, { backgroundColor: colors.background, borderColor: colors.border }]}
                        onPress={() => setShowEndDatePicker(true)}
                    >
                        <Text style={{ color: colors.text, fontSize: 16 }}>{recurringEndDate.toLocaleDateString()}</Text>
                    </TouchableOpacity>
                    <ModernDatePicker
                        visible={showEndDatePicker}
                        selectedDate={recurringEndDate}
                        onDateSelect={(selectedDate) => setRecurringEndDate(selectedDate)}
                        onClose={() => setShowEndDatePicker(false)}
                    />
                </View>
            )}

            <TouchableOpacity
                style={[styles.submitButton, { backgroundColor: colors.success, opacity: loading ? 0.7 : 1 }]}
                onPress={handleSubmit}
                disabled={loading}
            >
                <Text style={styles.submitButtonText}>{loading ? 'Saving...' : (isEditing ? 'Update Transaction' : 'Save Transaction')}</Text>
            </TouchableOpacity>

            <Modal transparent={true} visible={pickerVisible} animationType="slide">
                <View style={styles.modalBg}>
                    <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
                        <View style={styles.modalHeader}>
                            <Text style={[styles.modalTitle, { color: colors.text }]}>Select Category</Text>
                            <TouchableOpacity onPress={() => setPickerVisible(false)}>
                                <Text style={{ fontSize: 24, color: colors.subText }}>×</Text>
                            </TouchableOpacity>
                        </View>

                        <ScrollView>
                            {/* Rendering categories exactly as they come to preserve order */}
                            {categories.map(cat => (
                                <TouchableOpacity
                                    key={cat._id}
                                    style={[styles.catOption, { borderBottomColor: colors.border }]}
                                    onPress={() => {
                                        setCategory(cat._id);
                                        setPickerVisible(false);
                                    }}
                                >
                                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                        {/* Optional color dot if category has color */}
                                        <View style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: cat.color || colors.primary, marginRight: 10 }} />
                                        <Text style={[styles.catText, { color: colors.text }]}>{cat.name}</Text>
                                    </View>
                                    {category === cat._id && <Text style={{ color: colors.primary, fontWeight: 'bold' }}>✓</Text>}
                                </TouchableOpacity>
                            ))}
                        </ScrollView>

                    </View>
                </View>
            </Modal>

            {/* Custom Alert */}
            <CustomAlert
                visible={showAlert}
                type={alertConfig.type}
                title={alertConfig.title}
                message={alertConfig.message}
                buttons={alertConfig.buttons}
                onClose={() => setShowAlert(false)}
            />

        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flexGrow: 1, padding: 20 },
    header: { alignItems: 'center', marginBottom: 25, marginTop: 10 },
    headerTitle: { fontSize: 24, fontWeight: '800' },
    typeContainer: { flexDirection: 'row', marginBottom: 20, borderWidth: 1, borderRadius: 12 },
    typeButton: { flex: 1, paddingVertical: 12, alignItems: 'center' },
    typeText: { fontWeight: '700', fontSize: 16 },
    label: { marginBottom: 6, fontSize: 14, fontWeight: '600' },
    input: { padding: 14, borderRadius: 12, marginBottom: 15, borderWidth: 1, fontSize: 16 },
    dateInput: { justifyContent: 'center' },
    pickerTrigger: { padding: 14, borderRadius: 12, marginBottom: 20, borderWidth: 1, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    submitButton: { padding: 16, borderRadius: 12, alignItems: 'center', marginTop: 10, shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 4 },
    submitButtonText: { color: 'white', fontWeight: 'bold', fontSize: 16 },
    row: { flexDirection: 'row' },
    recurringContainer: { padding: 15, borderRadius: 12, marginBottom: 20, borderWidth: 1 },
    periodContainer: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 15 },
    periodButton: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, borderWidth: 1, marginRight: 8, marginBottom: 8 },
    periodText: { fontSize: 13, fontWeight: '600' },
    modalBg: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
    modalContent: { padding: 20, borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: '60%' },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
    modalTitle: { fontSize: 20, fontWeight: 'bold' },
    catOption: { paddingVertical: 16, borderBottomWidth: 1, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    catText: { fontSize: 16, fontWeight: '500' },
});
