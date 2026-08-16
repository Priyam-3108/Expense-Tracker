import React, { useState, useCallback } from 'react';
import {
    View, Text, StyleSheet, TouchableOpacity, ScrollView,
    StatusBar, RefreshControl, Alert, Platform
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../context/ThemeContext';
import { debtService } from '../services/debtService';
import hapticFeedback from '../utils/haptics';

const fmt = (n) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 0 }).format(n || 0);
const fmtShort = (n) => new Intl.NumberFormat('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(n || 0);

function DebtScreen({ navigation }) {
    const { colors, isDark, shadows, borderRadius } = useTheme();
    const insets = useSafeAreaInsets();
    const [debts, setDebts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [filter, setFilter] = useState('all'); // 'all' | 'borrowed' | 'lent' | 'paid'
    const [repayDebt, setRepayDebt] = useState(null); // debt object for repay modal

    const fetchDebts = async () => {
        try {
            const res = await debtService.getDebts();
            if (res.data?.success) {
                setDebts(res.data.data.debts || []);
            }
        } catch (e) {
            console.error('Debt fetch error:', e);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useFocusEffect(useCallback(() => { fetchDebts(); }, []));
    const onRefresh = () => { setRefreshing(true); fetchDebts(); };

    const handleDelete = (debt) => {
        hapticFeedback.medium();
        Alert.alert('Delete Debt', `Delete "${debt.personName}"? This cannot be undone.`, [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Delete', style: 'destructive',
                onPress: async () => {
                    try {
                        await debtService.deleteDebt(debt._id);
                        hapticFeedback.success();
                        fetchDebts();
                    } catch {
                        hapticFeedback.error();
                        Alert.alert('Error', 'Failed to delete debt record.');
                    }
                }
            }
        ]);
    };

    // Derived data
    const filteredDebts = debts.filter(d => {
        if (filter === 'all') return d.status !== 'paid';
        if (filter === 'paid') return d.status === 'paid';
        return d.type === filter;
    });

    const totalBorrowed = debts.filter(d => d.type === 'borrowed' && d.status !== 'paid').reduce((s, d) => s + (d.currentAmount || 0), 0);
    const totalLent = debts.filter(d => d.type === 'lent' && d.status !== 'paid').reduce((s, d) => s + (d.currentAmount || 0), 0);
    const paidCount = debts.filter(d => d.status === 'paid').length;

    const getStatusColor = (status) => {
        if (status === 'paid') return colors.success;
        if (status === 'partially_paid') return colors.warning;
        return colors.danger;
    };
    const getStatusLabel = (status) => ({ paid: 'Paid', partially_paid: 'Partial', pending: 'Pending' }[status] || status);

    const getDueBadge = (dueDate, status) => {
        if (!dueDate || status === 'paid') return null;
        const due = new Date(dueDate);
        const today = new Date();
        const diffDays = Math.ceil((due - today) / (1000 * 60 * 60 * 24));
        if (diffDays < 0) return { label: `${Math.abs(diffDays)}d overdue`, color: colors.danger };
        if (diffDays <= 7) return { label: `${diffDays}d left`, color: colors.warning };
        return { label: due.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }), color: colors.subText };
    };

    const getInitials = (name) => (name || '?').split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);

    const filterTabs = [
        { id: 'all', label: 'Active', icon: 'layers-outline' },
        { id: 'borrowed', label: 'I Owe', icon: 'arrow-down-circle-outline' },
        { id: 'lent', label: 'Owed Me', icon: 'arrow-up-circle-outline' },
        { id: 'paid', label: 'Paid', icon: 'checkmark-circle-outline' },
    ];

    const s = StyleSheet.create({
        container: { flex: 1, backgroundColor: colors.background },

        // Header
        header: { paddingTop: Platform.OS === 'ios' ? 54 : 44, paddingHorizontal: 20, paddingBottom: 10 },
        headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
        title: { fontSize: 32, fontWeight: '300', color: colors.text, letterSpacing: -0.8 },
        addBtn: {
            flexDirection: 'row', alignItems: 'center', gap: 6,
            backgroundColor: colors.primary, paddingHorizontal: 14, paddingVertical: 9,
            borderRadius: 9999, ...shadows.md,
        },
        addBtnText: { color: '#ffffff', fontSize: 14, fontWeight: '500' },

        // Summary cards
        summaryRow: { flexDirection: 'row', gap: 12, paddingHorizontal: 16, marginTop: 16, marginBottom: 16 },
        summaryCard: {
            flex: 1, borderRadius: 18, overflow: 'hidden', ...shadows.md,
        },
        summaryGradient: { padding: 16 },
        summaryLabel: { fontSize: 11, color: 'rgba(255,255,255,0.7)', fontWeight: '500', letterSpacing: 0.5, marginBottom: 6, textTransform: 'uppercase' },
        summaryAmount: { fontSize: 22, fontWeight: '300', color: '#ffffff', letterSpacing: -0.6, fontVariant: ['tabular-nums'] },
        summaryMeta: { fontSize: 11, color: 'rgba(255,255,255,0.6)', marginTop: 4, fontWeight: '300' },
        paidCard: {
            flex: 1, borderRadius: 18, backgroundColor: colors.card,
            borderWidth: 1, borderColor: colors.border, padding: 16, ...shadows.sm,
        },
        paidLabel: { fontSize: 11, color: colors.subText, fontWeight: '500', letterSpacing: 0.5, marginBottom: 6, textTransform: 'uppercase' },
        paidCount: { fontSize: 22, fontWeight: '300', color: colors.text, letterSpacing: -0.6 },
        paidMeta: { fontSize: 11, color: colors.subText, marginTop: 4 },

        // Filter tabs
        filterRow: {
            flexDirection: 'row', gap: 6, paddingHorizontal: 16,
            marginBottom: 14, flexWrap: 'nowrap',
        },
        filterTab: {
            flexDirection: 'row', alignItems: 'center', gap: 5,
            paddingHorizontal: 12, paddingVertical: 7,
            borderRadius: 9999, borderWidth: 1,
        },
        filterTabText: { fontSize: 12, fontWeight: '500' },

        // Debt card
        debtCard: {
            marginHorizontal: 16, marginBottom: 10,
            backgroundColor: colors.card, borderRadius: 16,
            borderWidth: 1, borderColor: colors.border,
            overflow: 'hidden', ...shadows.sm,
        },
        cardAccent: { width: 4, position: 'absolute', top: 0, bottom: 0, left: 0, borderTopLeftRadius: 16, borderBottomLeftRadius: 16 },
        cardInner: { flexDirection: 'row', alignItems: 'center', padding: 14, paddingLeft: 18 },
        avatar: {
            width: 46, height: 46, borderRadius: 23,
            justifyContent: 'center', alignItems: 'center', marginRight: 12,
        },
        avatarText: { fontSize: 16, fontWeight: '500', color: '#ffffff' },
        cardContent: { flex: 1 },
        personName: { fontSize: 16, fontWeight: '400', color: colors.text, letterSpacing: -0.2, marginBottom: 3 },
        cardMetaRow: { flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' },
        statusPill: { paddingHorizontal: 7, paddingVertical: 2, borderRadius: 9999 },
        statusText: { fontSize: 10, fontWeight: '600' },
        duePill: { paddingHorizontal: 7, paddingVertical: 2, borderRadius: 9999, backgroundColor: colors.borderLight },
        dueText: { fontSize: 10, fontWeight: '500' },
        cardRight: { alignItems: 'flex-end', gap: 8 },
        debtAmount: { fontSize: 16, fontWeight: '500', letterSpacing: -0.4, fontVariant: ['tabular-nums'] },
        debtOriginal: { fontSize: 11, color: colors.subText, fontVariant: ['tabular-nums'] },
        progressBarBg: { height: 3, borderRadius: 2, backgroundColor: colors.borderLight, marginTop: 8, marginHorizontal: 18, marginBottom: 2 },
        progressBarFill: { height: 3, borderRadius: 2 },

        // Actions row
        cardActions: {
            flexDirection: 'row', gap: 8, paddingHorizontal: 14, paddingBottom: 12, paddingTop: 4,
        },
        actionBtn: {
            flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
            gap: 4, paddingVertical: 8, borderRadius: 10, borderWidth: 1,
        },
        actionBtnText: { fontSize: 12, fontWeight: '500' },

        // Empty
        empty: { alignItems: 'center', paddingTop: 60, paddingHorizontal: 40 },
        emptyIcon: {
            width: 72, height: 72, borderRadius: 36,
            backgroundColor: colors.primarySubdued, justifyContent: 'center', alignItems: 'center', marginBottom: 16,
        },
        emptyTitle: { fontSize: 20, fontWeight: '300', color: colors.text, letterSpacing: -0.4, marginBottom: 6, textAlign: 'center' },
        emptySubtitle: { fontSize: 14, color: colors.subText, textAlign: 'center', lineHeight: 20 },
    });

    const renderDebt = (debt) => {
        const isBorrowed = debt.type === 'borrowed';
        const typeColor = isBorrowed ? colors.danger : colors.success;
        const progress = debt.amount > 0 ? (1 - (debt.currentAmount / debt.amount)) : 1;
        const dueBadge = getDueBadge(debt.dueDate, debt.status);
        const isPaid = debt.status === 'paid';

        return (
            <View key={debt._id} style={s.debtCard}>
                <View style={[s.cardAccent, { backgroundColor: typeColor }]} />

                <View style={s.cardInner}>
                    {/* Avatar */}
                    <LinearGradient
                        colors={isBorrowed ? [colors.dangerDark || '#c71852', colors.danger] : [colors.successDark || '#059669', colors.success]}
                        start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                        style={s.avatar}
                    >
                        <Text style={s.avatarText}>{getInitials(debt.personName)}</Text>
                    </LinearGradient>

                    {/* Content */}
                    <View style={s.cardContent}>
                        <Text style={s.personName}>{debt.personName}</Text>
                        <View style={s.cardMetaRow}>
                            <View style={[s.statusPill, { backgroundColor: getStatusColor(debt.status) + '20' }]}>
                                <Text style={[s.statusText, { color: getStatusColor(debt.status) }]}>{getStatusLabel(debt.status)}</Text>
                            </View>
                            <View style={[s.statusPill, { backgroundColor: typeColor + '15' }]}>
                                <Text style={[s.statusText, { color: typeColor }]}>{isBorrowed ? '↓ You Owe' : '↑ They Owe'}</Text>
                            </View>
                            {dueBadge && (
                                <View style={[s.duePill, { backgroundColor: dueBadge.color + '15' }]}>
                                    <Text style={[s.dueText, { color: dueBadge.color }]}>{dueBadge.label}</Text>
                                </View>
                            )}
                        </View>
                    </View>

                    {/* Right: Amount */}
                    <View style={s.cardRight}>
                        <Text style={[s.debtAmount, { color: typeColor }]}>₹{fmtShort(debt.currentAmount)}</Text>
                        {debt.currentAmount !== debt.amount && (
                            <Text style={s.debtOriginal}>of ₹{fmtShort(debt.amount)}</Text>
                        )}
                    </View>
                </View>

                {/* Progress bar */}
                {progress > 0 && (
                    <View style={s.progressBarBg}>
                        <View style={[s.progressBarFill, { width: `${Math.min(progress * 100, 100)}%`, backgroundColor: colors.success }]} />
                    </View>
                )}

                {/* Action buttons */}
                {!isPaid && (
                    <View style={s.cardActions}>
                        <TouchableOpacity
                            style={[s.actionBtn, { backgroundColor: colors.successBg || '#ecfdf5', borderColor: colors.success + '30' }]}
                            onPress={() => { hapticFeedback.light(); navigation.navigate('AddDebt', { debt, mode: 'repay' }); }}
                        >
                            <Ionicons name="cash-outline" size={14} color={colors.success} />
                            <Text style={[s.actionBtnText, { color: colors.success }]}>Record Payment</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[s.actionBtn, { backgroundColor: colors.primarySubdued, borderColor: colors.primary + '30', flex: 0.5 }]}
                            onPress={() => { hapticFeedback.light(); navigation.navigate('AddDebt', { debt, mode: 'edit' }); }}
                        >
                            <Ionicons name="pencil-outline" size={14} color={colors.primary} />
                            <Text style={[s.actionBtnText, { color: colors.primary }]}>Edit</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[s.actionBtn, { backgroundColor: colors.dangerBg || '#fff0f5', borderColor: colors.danger + '30', flex: 0.4 }]}
                            onPress={() => handleDelete(debt)}
                        >
                            <Ionicons name="trash-outline" size={14} color={colors.danger} />
                        </TouchableOpacity>
                    </View>
                )}
                {isPaid && (
                    <View style={s.cardActions}>
                        <TouchableOpacity
                            style={[s.actionBtn, { backgroundColor: colors.dangerBg || '#fff0f5', borderColor: colors.danger + '30' }]}
                            onPress={() => handleDelete(debt)}
                        >
                            <Ionicons name="trash-outline" size={14} color={colors.danger} />
                            <Text style={[s.actionBtnText, { color: colors.danger }]}>Remove</Text>
                        </TouchableOpacity>
                    </View>
                )}
            </View>
        );
    };

    return (
        <View style={s.container}>
            <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

            {/* Header */}
            <View style={s.header}>
                <View style={s.headerRow}>
                    <Text style={s.title}>Debts</Text>
                    <TouchableOpacity style={s.addBtn} onPress={() => { hapticFeedback.medium(); navigation.navigate('AddDebt', { mode: 'add' }); }}>
                        <Ionicons name="add" size={18} color="#ffffff" />
                        <Text style={s.addBtnText}>New</Text>
                    </TouchableOpacity>
                </View>
            </View>

            {/* Summary Strip */}
            <View style={s.summaryRow}>
                <View style={s.summaryCard}>
                    <LinearGradient colors={['#c71852', '#ea2261']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={s.summaryGradient}>
                        <Text style={s.summaryLabel}>You Owe</Text>
                        <Text style={s.summaryAmount}>₹{fmtShort(totalBorrowed)}</Text>
                        <Text style={s.summaryMeta}>{debts.filter(d => d.type === 'borrowed' && d.status !== 'paid').length} active</Text>
                    </LinearGradient>
                </View>
                <View style={s.summaryCard}>
                    <LinearGradient colors={['#059669', '#10b981']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={s.summaryGradient}>
                        <Text style={s.summaryLabel}>Owed To You</Text>
                        <Text style={s.summaryAmount}>₹{fmtShort(totalLent)}</Text>
                        <Text style={s.summaryMeta}>{debts.filter(d => d.type === 'lent' && d.status !== 'paid').length} active</Text>
                    </LinearGradient>
                </View>
                <View style={s.paidCard}>
                    <Text style={s.paidLabel}>Cleared</Text>
                    <Text style={s.paidCount}>{paidCount}</Text>
                    <Text style={s.paidMeta}>debts settled</Text>
                </View>
            </View>

            {/* Filter Tabs */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.filterRow}>
                {filterTabs.map(tab => {
                    const isActive = filter === tab.id;
                    return (
                        <TouchableOpacity
                            key={tab.id}
                            style={[s.filterTab, {
                                backgroundColor: isActive ? colors.primary : colors.card,
                                borderColor: isActive ? colors.primary : colors.border,
                            }]}
                            onPress={() => { hapticFeedback.light(); setFilter(tab.id); }}
                        >
                            <Ionicons name={tab.icon} size={13} color={isActive ? '#ffffff' : colors.subText} />
                            <Text style={[s.filterTabText, { color: isActive ? '#ffffff' : colors.subText }]}>{tab.label}</Text>
                        </TouchableOpacity>
                    );
                })}
            </ScrollView>

            {/* Debt List */}
            <ScrollView
                showsVerticalScrollIndicator={false}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} colors={[colors.primary]} />}
                contentContainerStyle={{ paddingBottom: (Platform.OS === 'ios' ? 88 : 75) + insets.bottom + 16 }}
            >
                {loading ? (
                    // Skeleton placeholders
                    [1, 2, 3].map(i => (
                        <View key={i} style={[s.debtCard, { minHeight: 80 }]}>
                            <View style={[s.cardAccent, { backgroundColor: colors.border }]} />
                        </View>
                    ))
                ) : filteredDebts.length === 0 ? (
                    <View style={s.empty}>
                        <View style={s.emptyIcon}>
                            <Ionicons name="card-outline" size={32} color={colors.primary} />
                        </View>
                        <Text style={s.emptyTitle}>
                            {filter === 'paid' ? 'No Paid Debts' : 'No Debts Here'}
                        </Text>
                        <Text style={s.emptySubtitle}>
                            {filter === 'paid'
                                ? 'Settled debts will appear here once marked as paid.'
                                : 'Track money you owe or money owed to you. Tap New to add one.'}
                        </Text>
                    </View>
                ) : (
                    filteredDebts.map(renderDebt)
                )}
            </ScrollView>
        </View>
    );
}

export default DebtScreen;
