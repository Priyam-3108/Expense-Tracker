import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import hapticFeedback from '../utils/haptics';

function TransactionItem({ item, onPress, onEdit, onDelete }) {
    const { colors, spacing, borderRadius, shadows } = useTheme();

    const formatAmount = (amount) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(amount);
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
    };

    const getCategoryIcon = (categoryName) => {
        const iconMap = {
            food: 'fast-food',
            transport: 'car',
            shopping: 'cart',
            entertainment: 'game-controller',
            health: 'fitness',
            bills: 'receipt',
            education: 'school',
            salary: 'cash',
            other: 'ellipsis-horizontal',
        };
        return iconMap[categoryName?.toLowerCase()] || 'pricetag';
    };

    const getCategoryColor = (category) => {
        // If category object has a color set, use it directly
        if (item.category?.color) return item.category.color;

        const colorMap = {
            food: '#f59e0b',
            transport: '#533afd',
            shopping: '#ec4899',
            entertainment: '#8b5cf6',
            health: '#10b981',
            bills: '#ea2261',
            education: '#3b82f6',
            salary: '#10b981',
            other: '#64748b',
        };
        return colorMap[category?.toLowerCase()] || colors.primary;
    };

    const isIncome = item.type === 'income';
    const catName = item.category?.name || item.category || 'Uncategorized';
    const categoryColor = getCategoryColor(catName);
    const categoryIcon = getCategoryIcon(catName);
    const amountColor = isIncome ? colors.income : colors.expense;

    return (
        <TouchableOpacity
            style={[
                styles.container,
                {
                    backgroundColor: colors.card,
                    borderColor: colors.border,
                    borderRadius: borderRadius.lg,
                    marginBottom: spacing.sm,
                },
                shadows.sm,
            ]}
            onPress={() => {
                hapticFeedback.light();
                onPress && onPress(item);
            }}
            activeOpacity={0.75}
        >
            {/* Category icon - solid circle with gradient */}
            <LinearGradient
                colors={[categoryColor + 'cc', categoryColor]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.iconCircle}
            >
                <Ionicons name={categoryIcon} size={20} color="#ffffff" />
            </LinearGradient>

            {/* Content */}
            <View style={styles.content}>
                <Text style={[styles.categoryName, { color: colors.text }]} numberOfLines={1}>
                    {catName}
                </Text>
                <Text style={[styles.meta, { color: colors.subText }]} numberOfLines={1}>
                    {formatDate(item.date)}
                    {item.notes ? ` · ${item.notes.substring(0, 20)}${item.notes.length > 20 ? '…' : ''}` : ''}
                </Text>
            </View>

            {/* Right side: amount + sync status */}
            <View style={styles.right}>
                <Text style={[styles.amount, { color: amountColor }]}>
                    {isIncome ? '+' : '-'}{formatAmount(Math.abs(item.amount))}
                </Text>
                <View style={styles.statusRow}>
                    {item.syncStatus === 'PENDING' && (
                        <Ionicons name="time-outline" size={13} color={colors.warning} />
                    )}
                    {item.syncStatus === 'FAILED' && (
                        <Ionicons name="alert-circle-outline" size={13} color={colors.danger} />
                    )}
                    {onEdit && (
                        <TouchableOpacity
                            style={styles.actionBtn}
                            onPress={() => { hapticFeedback.light(); onEdit(item); }}
                            hitSlop={{ top: 8, bottom: 8, left: 8, right: 4 }}
                        >
                            <Ionicons name="create-outline" size={15} color={colors.primary} />
                        </TouchableOpacity>
                    )}
                    {onDelete && (
                        <TouchableOpacity
                            style={styles.actionBtn}
                            onPress={() => { hapticFeedback.light(); onDelete(item); }}
                            hitSlop={{ top: 8, bottom: 8, left: 4, right: 8 }}
                        >
                            <Ionicons name="trash-outline" size={15} color={colors.danger} />
                        </TouchableOpacity>
                    )}
                </View>
            </View>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 13,
        borderWidth: 1,
    },
    iconCircle: {
        width: 44,
        height: 44,
        borderRadius: 22,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    content: {
        flex: 1,
    },
    categoryName: {
        fontSize: 15,
        fontWeight: '400',
        marginBottom: 3,
        letterSpacing: -0.2,
    },
    meta: {
        fontSize: 12,
        fontWeight: '400',
        fontVariant: ['tabular-nums'],
    },
    right: {
        alignItems: 'flex-end',
        gap: 4,
    },
    amount: {
        fontSize: 15,
        fontWeight: '500',
        letterSpacing: -0.4,
        fontVariant: ['tabular-nums'],
    },
    statusRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    actionBtn: {
        padding: 2,
    },
});

export default TransactionItem;
