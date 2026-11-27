import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, StatusBar, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { usePrivacy } from '../context/PrivacyContext';
import { expenseService } from '../services/expenseService';
import BarChart from '../components/charts/BarChart';
import Amount from '../components/Amount';
import EmptyState from '../components/EmptyState';
import hapticFeedback from '../utils/haptics';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const parse = (s) => { const [y, m, d] = s.slice(0, 10).split('-').map(Number); return new Date(y, m - 1, d); };
const ymd = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const dayLabel = (d) => `${MONTHS[d.getMonth()]} ${d.getDate()}`;
const DAY = 86400000;

// Spending over the range in a handful of bars: by day up to two weeks, by week up to three months, else by month
function bucketize(entries, startDate, endDate) {
    if (!entries.length) return [];
    const start = parse(startDate);
    const end = parse(endDate);
    const days = Math.round((end - start) / DAY) + 1;
    const buckets = [];
    if (days <= 92) {
        const step = days <= 14 ? 1 : 7;
        for (let t = start.getTime(); t <= end.getTime(); t += step * DAY) {
            const d = new Date(t);
            buckets.push({ from: ymd(d), label: dayLabel(d), amount: 0 });
        }
    } else {
        for (let d = new Date(start.getFullYear(), start.getMonth(), 1); d <= end; d = new Date(d.getFullYear(), d.getMonth() + 1, 1)) {
            buckets.push({ from: ymd(d), label: `${MONTHS[d.getMonth()]} ${String(d.getFullYear()).slice(2)}`, amount: 0 });
        }
    }
    entries.forEach((e) => {
        const day = e.date.slice(0, 10);
        for (let i = buckets.length - 1; i >= 0; i--) {
            if (day >= buckets[i].from) { buckets[i].amount += e.amount || 0; break; }
        }
    });
    return buckets;
}

function CategoryDetailScreen({ navigation, route }) {
    const { categoryId, name, startDate, endDate, totalExpenses = 0 } = route.params;
    const { colors, isDark, spacing, borderRadius } = useTheme();
    const { isPrivate } = usePrivacy();
    const [entries, setEntries] = useState([]);
    const [loading, setLoading] = useState(true);
    const [failed, setFailed] = useState(false);
    const [sortBy, setSortBy] = useState('date'); // 'date' | 'amount'

    useEffect(() => {
        expenseService.getExpenses({ category: categoryId, type: 'expense', startDate, endDate, sortBy: 'date', sortOrder: 'desc' })
            .then((res) => setEntries(res.data?.data?.expenses || []))
            .catch(() => setFailed(true))
            .finally(() => setLoading(false));
    }, [categoryId, startDate, endDate]);

    const stats = useMemo(() => {
        const total = entries.reduce((s, e) => s + (e.amount || 0), 0);
        const largest = entries.reduce((max, e) => (e.amount > (max?.amount || 0) ? e : max), null);
        return { total, count: entries.length, average: entries.length ? total / entries.length : 0, largest };
    }, [entries]);

    const series = useMemo(() => bucketize(entries, startDate, endDate), [entries, startDate, endDate]);
    const sorted = useMemo(() => [...entries].sort((a, b) =>
        sortBy === 'amount' ? b.amount - a.amount : b.date.localeCompare(a.date)
    ), [entries, sortBy]);
    const share = totalExpenses > 0 ? Math.round((stats.total / totalExpenses) * 100) : 0;
    const rangeLabel = `${dayLabel(parse(startDate))} – ${dayLabel(parse(endDate))}, ${parse(endDate).getFullYear()}`;

    const styles = StyleSheet.create({
        container: { flex: 1, backgroundColor: colors.background },
        header: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingHorizontal: spacing.lg, paddingTop: 50, paddingBottom: spacing.md },
        backButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, justifyContent: 'center', alignItems: 'center' },
        title: { fontSize: 22, fontWeight: '500', color: colors.text },
        subtitle: { fontSize: 13, color: colors.subText, marginTop: 2 },
        content: { paddingHorizontal: spacing.lg, paddingBottom: 40 },
        grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: spacing.lg },
        figure: { width: '48%', flexGrow: 1, padding: 14, borderRadius: borderRadius.lg, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.card },
        figureLabel: { fontSize: 12, color: colors.subText },
        figureValue: { fontSize: 18, fontWeight: '500', color: colors.text, marginTop: 6, fontVariant: ['tabular-nums'] },
        figureSub: { fontSize: 12, color: colors.subText, marginTop: 2 },
        card: { backgroundColor: colors.card, borderRadius: borderRadius.lg, borderWidth: 1, borderColor: colors.border },
        sectionRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: spacing.lg, marginBottom: spacing.sm },
        sectionTitle: { fontSize: 17, color: colors.text },
        segment: { flexDirection: 'row', gap: 4, padding: 3, borderRadius: 8, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.cardElevated },
        segmentBtn: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 6 },
        segmentText: { fontSize: 13 },
        row: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, padding: spacing.md },
        rowDate: { width: 52, fontSize: 12, color: colors.subText, paddingTop: 2, fontVariant: ['tabular-nums'] },
        rowTitle: { fontSize: 15, color: colors.text },
        rowNotes: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },
        tags: { flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginTop: 6 },
        tag: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, backgroundColor: colors.cardElevated },
        tagText: { fontSize: 11, color: colors.textSecondary },
        rowAmount: { fontSize: 15, color: colors.text, fontVariant: ['tabular-nums'] },
    });

    const figure = (label, value, sub) => (
        <View style={styles.figure}>
            <Text style={styles.figureLabel}>{label}</Text>
            {typeof value === 'number' && label === 'Entries'
                ? <Text style={styles.figureValue}>{value}</Text>
                : <Amount value={value} style={styles.figureValue} />}
            {sub ? <Text style={styles.figureSub}>{sub}</Text> : null}
        </View>
    );

    return (
        <View style={styles.container}>
            <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
            <View style={styles.header}>
                <TouchableOpacity style={styles.backButton} onPress={() => { hapticFeedback.light(); navigation.goBack(); }} accessibilityLabel="Back">
                    <Ionicons name="arrow-back" size={20} color={colors.text} />
                </TouchableOpacity>
                <View style={{ flex: 1 }}>
                    <Text style={styles.title} numberOfLines={1}>{name}</Text>
                    <Text style={styles.subtitle}>{rangeLabel}</Text>
                </View>
            </View>

            {loading ? (
                <ActivityIndicator color={colors.primary} style={{ marginTop: 40 }} />
            ) : failed ? (
                <EmptyState icon="cloud-offline-outline" title="Could not load entries" subtitle="Check your connection and open this category again" />
            ) : entries.length === 0 ? (
                <EmptyState icon="receipt-outline" title="No entries" subtitle="Nothing was spent in this category in this period" />
            ) : (
                <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
                    <View style={styles.grid}>
                        {figure('Total', stats.total, `${share}% of expenses`)}
                        {figure('Entries', stats.count)}
                        {figure('Average', stats.average, 'per entry')}
                        {figure('Largest', stats.largest?.amount, stats.largest && dayLabel(parse(stats.largest.date)))}
                    </View>

                    {series.length > 1 && (
                        <View style={[styles.card, { paddingVertical: 4 }]}>
                            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                                <BarChart
                                    data={series.map((b) => b.amount)}
                                    labels={series.map((b) => b.label)}
                                    width={Math.max(series.length * 56, 320)}
                                    height={180}
                                    hideValues={isPrivate}
                                />
                            </ScrollView>
                        </View>
                    )}

                    <View style={styles.sectionRow}>
                        <Text style={styles.sectionTitle}>Entries</Text>
                        <View style={styles.segment}>
                            {[['date', 'Newest'], ['amount', 'Largest']].map(([value, label]) => (
                                <TouchableOpacity
                                    key={value}
                                    onPress={() => { hapticFeedback.light(); setSortBy(value); }}
                                    accessibilityState={{ selected: sortBy === value }}
                                    style={[styles.segmentBtn, sortBy === value && { backgroundColor: colors.card }]}
                                >
                                    <Text style={[styles.segmentText, { color: sortBy === value ? colors.text : colors.subText }]}>{label}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>

                    <View style={styles.card}>
                        {sorted.map((e, i) => (
                            <View key={e._id} style={[styles.row, i > 0 && { borderTopWidth: 1, borderTopColor: colors.borderLight }]}>
                                <Text style={styles.rowDate}>{dayLabel(parse(e.date))}</Text>
                                <View style={{ flex: 1 }}>
                                    <Text style={[styles.rowTitle, !e.description && { color: colors.subText }]} numberOfLines={1}>
                                        {e.description || 'No description'}
                                    </Text>
                                    {e.notes ? <Text style={styles.rowNotes} numberOfLines={2}>{e.notes}</Text> : null}
                                    {(e.tags?.length > 0 || e.isRecurring) && (
                                        <View style={styles.tags}>
                                            {e.isRecurring && (
                                                <View style={styles.tag}><Text style={styles.tagText}>Recurring{e.recurringPeriod ? `, ${e.recurringPeriod}` : ''}</Text></View>
                                            )}
                                            {e.tags?.map((tag) => (
                                                <View key={tag} style={styles.tag}><Text style={styles.tagText}>#{tag}</Text></View>
                                            ))}
                                        </View>
                                    )}
                                </View>
                                <Amount value={e.amount} style={styles.rowAmount} />
                            </View>
                        ))}
                    </View>
                </ScrollView>
            )}
        </View>
    );
}

export default CategoryDetailScreen;
