import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import hapticFeedback from '../utils/haptics';
import Amount from './Amount';
import { iconForCategory } from '../utils/categoryIcons';

function TransactionItem({ item, onPress, onEdit, onDelete }) {
    const { colors, spacing, borderRadius, shadows } = useTheme();

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
            ...colors.categoryColors,
            salary: colors.income,
        };
        return colorMap[category?.toLowerCase()] || colors.primary;
    };

    const isIncome = item.type === 'income';
    const catName = item.category?.name || item.category || 'Uncategorized';
    const categoryColor = getCategoryColor(catName);
    const categoryIcon = item.category?.icon ? iconForCategory(item.category.icon) : getCategoryIcon(catName) + '-outline';
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
            ]}
            onPress={() => {
                hapticFeedback.light();
                onPress && onPress(item);
            }}
            activeOpacity={0.75}
        >
            {/* Category: neutral tile with a line icon; the colour lives in the dot */}
            <View style={[styles.iconTile, { backgroundColor: colors.cardElevated }]}>
                <Ionicons name={categoryIcon} size={18} color={colors.textSecondary} />
            </View>

            {/* Content */}
            <View style={styles.content}>
                <View style={styles.nameRow}>
                    <View style={[styles.dot, { backgroundColor: categoryColor }]} />
                    <Text style={[styles.categoryName, { color: colors.text }]} numberOfLines={1}>
                        {catName}
                    </Text>
                </View>
                <Text style={[styles.meta, { color: colors.subText }]} numberOfLines={1}>
                    {formatDate(item.date)}
                    {item.notes ? ` · ${item.notes.substring(0, 20)}${item.notes.length > 20 ? '…' : ''}` : ''}
                </Text>
            </View>

            {/* Right side: amount + sync status */}
            <View style={styles.right}>
                <Amount
                    value={Math.abs(item.amount)}
                    sign={isIncome ? '+' : '−'}
                    currency="INR"
                    style={[styles.amount, { color: amountColor }]}
                />
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
                            <Ionicons name="create-outline" size={16} color={colors.subText} />
                        </TouchableOpacity>
                    )}
                    {onDelete && (
                        <TouchableOpacity
                            style={styles.actionBtn}
                            onPress={() => { hapticFeedback.light(); onDelete(item); }}
                            hitSlop={{ top: 8, bottom: 8, left: 4, right: 8 }}
                        >
                            <Ionicons name="trash-outline" size={16} color={colors.subText} />
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
        paddingHorizontal: 12,
        paddingVertical: 12,
        borderWidth: 1,
    },
    iconTile: {
        width: 40,
        height: 40,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    nameRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginBottom: 2,
    },
    dot: {
        width: 6,
        height: 6,
        borderRadius: 3,
    },
    content: {
        flex: 1,
    },
    categoryName: {
        flexShrink: 1,
        fontSize: 15,
        fontWeight: '400',
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
        fontVariant: ['tabular-nums'],
    },
    statusRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    actionBtn: {
        padding: 4,
    },
});

export default TransactionItem;
