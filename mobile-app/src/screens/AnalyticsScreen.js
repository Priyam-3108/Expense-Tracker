import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, StatusBar, TouchableOpacity, RefreshControl, Platform } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { expenseService } from '../services/expenseService';
import BarChart from '../components/charts/BarChart';
import PieChart from '../components/charts/PieChart';
import LineChart from '../components/charts/LineChart';
import InsightCard from '../components/InsightCard';
import { SkeletonCard } from '../components/SkeletonLoader';
import hapticFeedback from '../utils/haptics';

function AnalyticsScreen() {
    const { colors, isDark, spacing, borderRadius, shadows } = useTheme();
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [selectedPeriod, setSelectedPeriod] = useState('month'); // 'week', 'month', '3months', '6months', 'year', 'custom'
    const [chartType, setChartType] = useState('bar'); // 'bar', 'pie', 'line'

    // Custom Date Range State
    const [customStartDate, setCustomStartDate] = useState(new Date());
    const [customEndDate, setCustomEndDate] = useState(new Date());
    const [showStartPicker, setShowStartPicker] = useState(false);
    const [showEndPicker, setShowEndPicker] = useState(false);

    const [analyticsData, setAnalyticsData] = useState({
        monthlyExpenses: [],
        categoryBreakdown: [],
        spendingTrend: [],
        insights: [],
    });

    const getDateRange = useCallback(() => {
        const end = new Date();
        const start = new Date();

        switch (selectedPeriod) {
            case 'week':
                start.setDate(end.getDate() - 7);
                return { start, end };
            case 'month':
                start.setDate(1);
                return { start, end };
            case '3months':
                start.setMonth(end.getMonth() - 3);
                return { start, end };
            case '6months':
                start.setMonth(end.getMonth() - 6);
                return { start, end };
            case 'year':
                start.setFullYear(end.getFullYear(), 0, 1);
                return { start, end };
            case 'custom':
                return { start: customStartDate, end: customEndDate };
            default:
                start.setDate(1);
                return { start, end };
        }
    }, [selectedPeriod, customStartDate, customEndDate]);

    const fetchAnalytics = async () => {
        try {
            const range = getDateRange();
            const start = range.start;
            const end = range.end;

            // Simple YYYY-MM-DD formatting (local time approx)
            // Ideally use date-fns or similar but simple splice works for local date object if offset handled.
            // But toISOString returns UTC.
            // Better:
            const formatDate = (date) => {
                const year = date.getFullYear();
                const month = String(date.getMonth() + 1).padStart(2, '0');
                const day = String(date.getDate()).padStart(2, '0');
                return `${year}-${month}-${day}`;
            };

            const startDateStr = formatDate(start);
            const endDateStr = formatDate(end);

            // Fetch analytics data from backend with explicit dates
            const response = await expenseService.getDetailedAnalytics({
                startDate: startDateStr,
                endDate: endDateStr
            });

            if (response.data.success) {
                const data = response.data.data;

                // Helper for month names
                const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

                // 1. Map Monthly Expenses (Bar Chart)
                const rawMonthly = data.monthlyComparison || data.monthlyExpenses || [];
                const monthlyExpenses = rawMonthly.map(item => {
                    const monthNum = item._id?.month || (typeof item.month === 'number' ? item.month : 0);
                    const monthName = monthNum > 0 ? monthNames[monthNum - 1] : (item.month || 'Unknown');
                    return {
                        month: monthName,
                        amount: parseFloat(item.expenses || item.amount || item.total || 0)
                    };
                });

                // 2. Map Category Breakdown (Pie Chart)
                const rawCategories = data.categoryBreakdown || [];
                const categoryBreakdown = rawCategories.map(item => ({
                    name: item.category?.name || item.name || 'Other',
                    population: parseFloat(item.totalAmount || item.amount || item.population || 0),
                    color: item.category?.color || item.color || '#cccccc',
                    legendFontColor: '#7F7F7F',
                    legendFontSize: 15
                }));

                // 3. Map Spending Trend (Line Chart) with better date formatting
                const rawTrend = data.dailyPattern || data.spendingTrend || [];
                const spendingTrend = rawTrend.map(item => {
                    const dateStr = item._id || item.day || '';

                    // Parse date string (YYYY-MM-DD format)
                    if (dateStr.length >= 10) {
                        const year = dateStr.substring(0, 4);
                        const monthNum = parseInt(dateStr.substring(5, 7), 10);
                        const day = dateStr.substring(8, 10);

                        const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
                        const monthName = monthNames[monthNum - 1] || '';

                        // Format as "DD Mon" (e.g., "09 Dec")
                        return {
                            day: `${day} ${monthName}`,
                            fullDate: dateStr,
                            amount: parseFloat(item.expenses || item.amount || 0)
                        };
                    }

                    // Fallback for other formats
                    return {
                        day: dateStr || '?',
                        fullDate: dateStr,
                        amount: parseFloat(item.expenses || item.amount || 0)
                    };
                });

                setAnalyticsData({
                    monthlyExpenses,
                    categoryBreakdown,
                    spendingTrend,
                    insights: generateInsights(data),
                });
            } else {
                setAnalyticsData(generateSampleData());
            }
        } catch (error) {
            console.error('Error fetching analytics:', error);
            setAnalyticsData(generateSampleData());
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const generateSampleData = () => {
        return {
            monthlyExpenses: [
                { month: 'Jan', amount: 15000 },
                { month: 'Feb', amount: 18000 },
                { month: 'Mar', amount: 12000 },
                { month: 'Apr', amount: 20000 },
                { month: 'May', amount: 16000 },
                { month: 'Jun', amount: 22000 },
            ],
            categoryBreakdown: [
                { name: 'Food', population: 8000, color: '#f59e0b' },
                { name: 'Transport', population: 5000, color: '#3b82f6' },
                { name: 'Shopping', population: 4000, color: '#ec4899' },
                { name: 'Entertainment', population: 3000, color: '#8b5cf6' },
                { name: 'Bills', population: 2000, color: '#ef4444' },
            ],
            spendingTrend: [
                { day: 'Mon', amount: 500 },
                { day: 'Tue', amount: 800 },
                { day: 'Wed', amount: 600 },
                { day: 'Thu', amount: 1200 },
                { day: 'Fri', amount: 900 },
                { day: 'Sat', amount: 1500 },
                { day: 'Sun', amount: 700 },
            ],
            insights: [
                {
                    icon: 'trending-up',
                    title: 'Spending Increased',
                    message: 'Your spending increased by 15% compared to last month',
                    type: 'warning',
                    trend: 'up',
                },
                {
                    icon: 'restaurant',
                    title: 'Top Category: Food',
                    message: 'You spent ₹8,000 on food this month, 36% of total expenses',
                    type: 'info',
                },
                {
                    icon: 'checkmark-circle',
                    title: 'Budget Goal Met',
                    message: 'You stayed within budget for Transportation this month!',
                    type: 'success',
                },
            ],
        };
    };

    const generateInsights = (data) => {
        const insights = [];

        // 1. Top Spending Category
        if (data.categoryBreakdown && data.categoryBreakdown.length > 0) {
            const topCategory = data.categoryBreakdown[0];
            const totalSpending = data.summary?.totalExpenses || 0;
            const percentage = totalSpending > 0
                ? ((topCategory.totalAmount / totalSpending) * 100).toFixed(1)
                : 0;

            insights.push({
                icon: 'star',
                title: `Top Category: ${topCategory.category?.name || 'Unknown'}`,
                message: `You spent ₹${topCategory.totalAmount?.toFixed(0) || 0} on ${topCategory.category?.name || 'this category'} (${percentage}% of total)`,
                type: 'info',
            });
        }

        // 2. Total Spending Summary
        if (data.summary) {
            const { totalExpenses, expenseCount, avgExpenseAmount } = data.summary;
            if (totalExpenses > 0) {
                insights.push({
                    icon: 'wallet',
                    title: 'Total Spending',
                    message: `₹${totalExpenses.toFixed(0)} across ${expenseCount} transactions (Avg: ₹${avgExpenseAmount?.toFixed(0) || 0})`,
                    type: 'info',
                });
            }
        }

        // 3. Savings Rate (if income data available)
        if (data.summary?.savingsRate !== undefined && data.summary.totalIncome > 0) {
            const rate = data.summary.savingsRate;
            insights.push({
                icon: rate > 20 ? 'trending-up' : rate > 0 ? 'remove' : 'trending-down',
                title: `Savings Rate: ${rate.toFixed(1)}%`,
                message: rate > 20
                    ? 'Great job! You\'re saving well this period.'
                    : rate > 0
                        ? 'You\'re saving, but there\'s room to improve.'
                        : 'Consider reducing expenses to start saving.',
                type: rate > 20 ? 'success' : rate > 0 ? 'info' : 'warning',
            });
        }

        // 4. Daily Average
        if (data.summary?.avgDailyExpense) {
            insights.push({
                icon: 'calendar',
                title: 'Daily Average',
                message: `You spend an average of ₹${data.summary.avgDailyExpense.toFixed(0)} per day`,
                type: 'info',
            });
        }

        return insights;
    };

    useFocusEffect(
        useCallback(() => {
            fetchAnalytics();
        }, [selectedPeriod, customStartDate, customEndDate])
    );

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        fetchAnalytics();
    }, [selectedPeriod, customStartDate, customEndDate]);

    const onDateChange = (event, selectedDate, type) => {
        if (type === 'start') {
            setShowStartPicker(Platform.OS === 'ios');
            if (selectedDate) setCustomStartDate(selectedDate);
        } else {
            setShowEndPicker(Platform.OS === 'ios');
            if (selectedDate) setCustomEndDate(selectedDate);
        }
    };

    const periods = [
        { id: 'week', label: 'Week' },
        { id: 'month', label: 'Month' },
        { id: '3months', label: '3M' },
        { id: '6months', label: '6M' },
        { id: 'year', label: 'Year' },
        { id: 'custom', label: 'Custom' },
    ];

    const chartTypes = [
        { id: 'bar', icon: 'bar-chart', label: 'Bar' },
        { id: 'pie', icon: 'pie-chart', label: 'Pie' },
        { id: 'line', icon: 'trending-up', label: 'Line' },
    ];

    const styles = StyleSheet.create({
        container: {
            flex: 1,
            backgroundColor: colors.background,
        },
        header: {
            paddingHorizontal: spacing.lg,
            paddingTop: 50,
            paddingBottom: spacing.md,
        },
        title: {
            fontSize: 28,
            fontWeight: 'bold',
            color: colors.text,
            marginBottom: spacing.sm,
        },
        periodSelector: {
            flexDirection: 'row',
            flexWrap: 'wrap',
            gap: spacing.sm,
            marginBottom: spacing.md,
        },
        periodButton: {
            paddingHorizontal: spacing.md,
            paddingVertical: spacing.sm,
            borderRadius: borderRadius.md,
            backgroundColor: colors.card,
            borderWidth: 1,
            borderColor: colors.border,
            minWidth: 70,
            alignItems: 'center',
            marginHorizontal: spacing.sm,
        },
        periodButtonActive: {
            backgroundColor: colors.primary,
            borderColor: colors.primary,
        },
        periodButtonText: {
            fontSize: 14,
            fontWeight: '600',
            color: colors.text,
        },
        periodButtonTextActive: {
            color: '#ffffff',
        },
        datePickerContainer: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            marginBottom: spacing.md,
            gap: spacing.md,
        },
        dateButton: {
            flex: 1,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: colors.card,
            padding: spacing.sm,
            borderRadius: borderRadius.md,
            borderWidth: 1,
            borderColor: colors.border,
            gap: spacing.sm,
        },
        dateButtonText: {
            color: colors.text,
            fontWeight: '500',
        },
        chartTypeSelector: {
            flexDirection: 'row',
            gap: spacing.sm,
            marginBottom: spacing.lg,
        },
        chartTypeButton: {
            flex: 1,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: spacing.xs,
            paddingVertical: spacing.sm,
            borderRadius: borderRadius.md,
            backgroundColor: colors.card,
            borderWidth: 1,
            borderColor: colors.border,
        },
        chartTypeButtonActive: {
            backgroundColor: colors.primary,
            borderColor: colors.primary,
        },
        chartTypeButtonText: {
            fontSize: 13,
            fontWeight: '600',
            color: colors.text,
        },
        chartTypeButtonTextActive: {
            color: '#ffffff',
        },
        content: {
            paddingHorizontal: spacing.lg,
        },
        section: {
            marginBottom: spacing.xl,
        },
        sectionTitle: {
            fontSize: 18,
            fontWeight: 'bold',
            color: colors.text,
            marginBottom: spacing.md,
        },
        chartCard: {
            backgroundColor: colors.card,
            borderRadius: borderRadius.lg,
            padding: spacing.md,
            ...shadows.md,
        },
        insightsSection: {
            marginBottom: spacing.xl,
        },
    });

    const renderChart = () => {
        if (chartType === 'bar') {
            const labels = analyticsData.monthlyExpenses.map(item => item.month);
            const data = analyticsData.monthlyExpenses.map(item => item.amount);
            // Calculate dynamic width: minimum 60px per data point, with minimum screen width
            const minWidth = Math.max(labels.length * 60, 320);
            return (
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    <BarChart data={data} labels={labels} width={minWidth} />
                </ScrollView>
            );
        } else if (chartType === 'pie') {
            // Fixed size pie chart without horizontal scroll
            return <PieChart data={analyticsData.categoryBreakdown} height={175} />;
        } else {
            // For line chart, aggregate daily data into weekly data for better visualization
            const dailyData = analyticsData.spendingTrend;

            if (dailyData.length === 0) {
                return null;
            }

            // Group by week or use monthly data if period is long
            let aggregatedData = [];
            let aggregatedLabels = [];

            if (selectedPeriod === 'week' || selectedPeriod === 'month') {
                // Show daily data for short periods (but limit to reasonable number)
                const maxPoints = 15;
                const step = Math.ceil(dailyData.length / maxPoints);

                for (let i = 0; i < dailyData.length; i += step) {
                    const chunk = dailyData.slice(i, i + step);
                    const totalAmount = chunk.reduce((sum, item) => sum + item.amount, 0);
                    const avgAmount = totalAmount / chunk.length;

                    // Use first day of chunk as label
                    aggregatedLabels.push(chunk[0].day);
                    aggregatedData.push(avgAmount);
                }
            } else {
                // For longer periods, use monthly aggregation
                aggregatedData = analyticsData.monthlyExpenses.map(item => item.amount);
                aggregatedLabels = analyticsData.monthlyExpenses.map(item => item.month);
            }

            const minWidth = Math.max(aggregatedLabels.length * 50, 320);
            return (
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    <LineChart data={aggregatedData} labels={aggregatedLabels} width={minWidth} />
                </ScrollView>
            );
        }
    };

    if (loading) {
        return (
            <View style={styles.container}>
                <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
                <View style={styles.header}>
                    <Text style={styles.title}>Analytics</Text>
                </View>
                <ScrollView style={styles.content}>
                    <SkeletonCard />
                    <SkeletonCard />
                    <SkeletonCard />
                </ScrollView>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

            <ScrollView
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        tintColor={colors.primary}
                        colors={[colors.primary]}
                    />
                }
            >
                <View style={styles.header}>
                    <Text style={styles.title}>Analytics</Text>

                    {/* Period Selector */}
                    <View style={styles.periodSelector}>
                        {periods.map(period => (
                            <TouchableOpacity
                                key={period.id}
                                style={[
                                    styles.periodButton,
                                    selectedPeriod === period.id && styles.periodButtonActive,
                                ]}
                                onPress={() => {
                                    hapticFeedback.light();
                                    setSelectedPeriod(period.id);
                                }}
                            >
                                <Text
                                    style={[
                                        styles.periodButtonText,
                                        selectedPeriod === period.id && styles.periodButtonTextActive,
                                    ]}
                                >
                                    {period.label}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>

                    {/* Custom Date Range Picker */}
                    {selectedPeriod === 'custom' && (
                        <View style={styles.datePickerContainer}>
                            <TouchableOpacity
                                style={styles.dateButton}
                                onPress={() => setShowStartPicker(true)}
                            >
                                <Ionicons name="calendar-outline" size={20} color={colors.primary} />
                                <Text style={styles.dateButtonText}>
                                    {customStartDate.toLocaleDateString()}
                                </Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={styles.dateButton}
                                onPress={() => setShowEndPicker(true)}
                            >
                                <Ionicons name="calendar-outline" size={20} color={colors.primary} />
                                <Text style={styles.dateButtonText}>
                                    {customEndDate.toLocaleDateString()}
                                </Text>
                            </TouchableOpacity>

                            {showStartPicker && (
                                <DateTimePicker
                                    value={customStartDate}
                                    mode="date"
                                    display="default"
                                    onChange={(e, date) => onDateChange(e, date, 'start')}
                                    maximumDate={new Date()}
                                />
                            )}

                            {showEndPicker && (
                                <DateTimePicker
                                    value={customEndDate}
                                    mode="date"
                                    display="default"
                                    onChange={(e, date) => onDateChange(e, date, 'end')}
                                    maximumDate={new Date()}
                                    minimumDate={customStartDate}
                                />
                            )}
                        </View>
                    )}
                </View>

                <View style={styles.content}>
                    {/* Chart Type Selector */}
                    <View style={styles.chartTypeSelector}>
                        {chartTypes.map(type => (
                            <TouchableOpacity
                                key={type.id}
                                style={[
                                    styles.chartTypeButton,
                                    chartType === type.id && styles.chartTypeButtonActive,
                                ]}
                                onPress={() => {
                                    hapticFeedback.light();
                                    setChartType(type.id);
                                }}
                            >
                                <Ionicons
                                    name={type.icon}
                                    size={16}
                                    color={chartType === type.id ? '#ffffff' : colors.text}
                                />
                                <Text
                                    style={[
                                        styles.chartTypeButtonText,
                                        chartType === type.id && styles.chartTypeButtonTextActive,
                                    ]}
                                >
                                    {type.label}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>

                    {/* Chart */}
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>
                            {chartType === 'bar'
                                ? 'Monthly Expenses'
                                : chartType === 'pie'
                                    ? 'Category Breakdown'
                                    : selectedPeriod === 'week' || selectedPeriod === 'month'
                                        ? 'Daily Spending Trend'
                                        : 'Monthly Spending Trend'}
                        </Text>
                        <View style={styles.chartCard}>
                            {(chartType === 'bar' && analyticsData.monthlyExpenses.length === 0) ||
                                (chartType === 'pie' && analyticsData.categoryBreakdown.length === 0) ||
                                (chartType === 'line' && analyticsData.spendingTrend.length === 0) ? (
                                <View style={{ padding: spacing.xl, alignItems: 'center' }}>
                                    <Ionicons name="bar-chart-outline" size={48} color={colors.subText} />
                                    <Text style={{ color: colors.subText, marginTop: spacing.md, textAlign: 'center' }}>
                                        No data available for this period
                                    </Text>
                                </View>
                            ) : (
                                renderChart()
                            )}
                        </View>
                    </View>

                    {/* Insights */}
                    <View style={styles.insightsSection}>
                        <Text style={styles.sectionTitle}>Insights</Text>
                        {analyticsData.insights.length > 0 ? (
                            analyticsData.insights.map((insight, index) => (
                                <InsightCard
                                    key={index}
                                    icon={insight.icon}
                                    title={insight.title}
                                    message={insight.message}
                                    type={insight.type}
                                    trend={insight.trend}
                                />
                            ))
                        ) : (
                            <View style={[styles.chartCard, { padding: spacing.xl, alignItems: 'center' }]}>
                                <Ionicons name="bulb-outline" size={48} color={colors.subText} />
                                <Text style={{ color: colors.subText, marginTop: spacing.md, textAlign: 'center' }}>
                                    No insights available yet. Add some expenses to see analytics!
                                </Text>
                            </View>
                        )}
                    </View>
                </View>
            </ScrollView>
        </View>
    );
}

export default AnalyticsScreen;
