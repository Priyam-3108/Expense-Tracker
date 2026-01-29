import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import hapticFeedback from '../utils/haptics';

function TransactionItem({
    item,
    onPress,
    onEdit,
    onDelete
}) {
    const { colors, spacing, borderRadius } = useTheme();

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
        return date.toLocaleDateString('en-IN', {
            day: '2-digit',
            month: 'short'
        });
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

    const getCategoryColor = (categoryName) => {
        const colorMap = {
            food: '#f59e0b',
            transport: '#3b82f6',
            shopping: '#ec4899',
            entertainment: '#8b5cf6',
            health: '#10b981',
            bills: '#ef4444',
            education: '#6366f1',
            salary: '#10b981',
            other: '#64748b',
        };
        return colorMap[categoryName?.toLowerCase()] || colors.primary;
    };

    const isIncome = item.type === 'income';
    const categoryColor = getCategoryColor(item.category?.name || item.category);
    const categoryIcon = getCategoryIcon(item.category?.name || item.category);

    const styles = StyleSheet.create({
        container: {
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: colors.card,
            padding: spacing.md,
            borderRadius: borderRadius.md,
            marginBottom: spacing.sm,
            borderLeftWidth: 4,
            borderLeftColor: categoryColor,
        },
        iconContainer: {
            width: 48,
            height: 48,
            borderRadius: 24,
            backgroundColor: `${categoryColor}20`,
            justifyContent: 'center',
            alignItems: 'center',
            marginRight: spacing.md,
        },
        content: {
            flex: 1,
        },
        categoryName: {
            fontSize: 16,
            fontWeight: '600',
            color: colors.text,
            marginBottom: 4,
        },
        date: {
            fontSize: 13,
            color: colors.subText,
        },
        amountContainer: {
            alignItems: 'flex-end',
        },
        amount: {
            fontSize: 18,
            fontWeight: 'bold',
            color: isIncome ? colors.success : colors.expense,
            marginBottom: 4,
        },
        actions: {
            flexDirection: 'row',
            gap: 8,
        },
        actionButton: {
            padding: 4,
        },
    });

    return (
        <TouchableOpacity
            style={styles.container}
            onPress={() => {
                hapticFeedback.light();
                onPress && onPress(item);
            }}
            activeOpacity={0.7}
        >
            <View style={styles.iconContainer}>
                <Ionicons name={categoryIcon} size={24} color={categoryColor} />
            </View>

            <View style={styles.content}>
                <Text style={styles.categoryName}>
                    {item.category?.name || item.category || 'Uncategorized'}
                </Text>
                <Text style={styles.date}>
                    {formatDate(item.date)} {item.notes ? `• ${item.notes.substring(0, 20)}${item.notes.length > 20 ? '...' : ''}` : ''}
                </Text>
            </View>

            <View style={styles.amountContainer}>
                <Text style={styles.amount}>
                    {isIncome ? '+' : '-'} {formatAmount(Math.abs(item.amount))}
                </Text>
                <View style={styles.actions}>
                    {onEdit && (
                        <TouchableOpacity
                            style={styles.actionButton}
                            onPress={() => {
                                hapticFeedback.light();
                                onEdit(item);
                            }}
                        >
                            <Ionicons name="create-outline" size={18} color={colors.primary} />
                        </TouchableOpacity>
                    )}
                    {onDelete && (
                        <TouchableOpacity
                            style={styles.actionButton}
                            onPress={() => {
                                hapticFeedback.light();
                                onDelete(item);
                            }}
                        >
                            <Ionicons name="trash-outline" size={18} color={colors.danger} />
                        </TouchableOpacity>
                    )}
                </View>
            </View>
        </TouchableOpacity>
    );
}

export default TransactionItem;
