import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, StatusBar, RefreshControl, Alert, Platform } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import DraggableFlatList, { ScaleDecorator } from 'react-native-draggable-flatlist';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useTheme } from '../context/ThemeContext';
import { categoryService } from '../services/categoryService';
import EmptyState from '../components/EmptyState';
import { SkeletonTransactionItem } from '../components/SkeletonLoader';
import hapticFeedback from '../utils/haptics';

function CategoriesScreen({ navigation }) {
    const { colors, isDark, spacing, borderRadius, shadows } = useTheme();
    const insets = useSafeAreaInsets();
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const fetchCategories = async () => {
        try {
            const response = await categoryService.getCategories();
            // Try to find the array in common locations
            let cats = [];
            const raw = response.data;

            if (Array.isArray(raw)) {
                cats = raw;
            } else if (raw && Array.isArray(raw.data)) {
                cats = raw.data;
            } else if (raw && raw.data && Array.isArray(raw.data.categories)) {
                cats = raw.data.categories;
            } else if (raw && Array.isArray(raw.categories)) {
                cats = raw.categories;
            }

            if (cats && cats.length > 0) {
                // Ensure all categories have required fields
                cats = cats.map(c => ({
                    ...c,
                    name: c.name || 'Unnamed',
                    icon: c.icon || '💰',
                    color: c.color || '#3B82F6'
                }));
                setCategories(cats);
            } else {
                setCategories([]);
            }
        } catch (error) {
            console.error('Error fetching categories:', error);
            setCategories([]);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useFocusEffect(
        useCallback(() => {
            fetchCategories();
        }, [])
    );

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        fetchCategories();
    }, []);

    const handleCategoryPress = (category) => {
        hapticFeedback.light();
        if (!category.isDefault) {
            navigation.navigate('AddEditCategory', { category });
        } else {
            Alert.alert('Default Category', 'Default categories cannot be edited');
        }
    };

    const handleAddCategory = () => {
        hapticFeedback.medium();
        navigation.navigate('AddEditCategory');
    };

    const handleDeleteCategory = (category) => {
        if (category.isDefault) {
            Alert.alert('Error', 'Default categories cannot be deleted');
            hapticFeedback.error();
            return;
        }

        const hasExpenses = category.expenseCount > 0;
        const message = hasExpenses
            ? `Are you sure you want to delete "${category.name}"? This category has ${category.expenseCount} associated expense${category.expenseCount !== 1 ? 's' : ''}. You'll need to reassign or delete those expenses first.`
            : `Are you sure you want to delete "${category.name}"? This action cannot be undone.`;

        Alert.alert(
            'Delete Category',
            message,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        hapticFeedback.medium();

                        try {
                            const response = await categoryService.deleteCategory(category._id);
                            const success = response?.data?.success !== false;

                            if (success) {
                                hapticFeedback.success();
                                Alert.alert('Success', 'Category deleted successfully');
                                fetchCategories();
                            } else {
                                const errorMsg = response?.data?.message || 'Failed to delete category';
                                hapticFeedback.error();
                                Alert.alert('Error', errorMsg);
                            }
                        } catch (error) {
                            console.error('Error deleting category:', error);
                            const errorMessage = error.response?.data?.message || 'Failed to delete category';
                            hapticFeedback.error();
                            Alert.alert('Error', errorMessage);
                        }
                    }
                }
            ]
        );
    };

    const handleDragEnd = async ({ data }) => {
        // Update local state immediately for smooth UX
        setCategories(data);
        hapticFeedback.medium();

        try {
            // Send new order to backend
            const newOrder = data.map(cat => cat._id);
            await categoryService.updateCategoryOrder(newOrder);
            hapticFeedback.success();
        } catch (error) {
            console.error('Error updating category order:', error);
            hapticFeedback.error();
            Alert.alert('Error', 'Failed to save category order');
            // Revert to previous order
            fetchCategories();
        }
    };

    const renderCategoryIcon = (item) => {
        const icon = item.icon;
        if (icon && [...icon].length <= 2) {
            // It's likely an Emoji
            return <Text style={{ fontSize: 24 }}>{icon}</Text>;
        }
        if (icon && icon.length > 2) {
            // It's likely an Ionicon name
            return <Ionicons name={icon} size={24} color={item.color || colors.primary} />;
        }
        // Fallback: First letter of name
        return (
            <Text style={{ fontSize: 20, fontWeight: 'bold', color: item.color || colors.primary }}>
                {(item.name || '?').charAt(0).toUpperCase()}
            </Text>
        );
    };

    const renderCategory = ({ item, drag, isActive }) => {
        const itemStyles = StyleSheet.create({
            categoryItem: {
                flexDirection: 'row',
                alignItems: 'center',
                backgroundColor: isActive ? colors.borderLight : colors.card,
                paddingVertical: spacing.md,
                paddingHorizontal: spacing.sm,
                borderRadius: borderRadius.lg,
                marginBottom: spacing.sm,
                marginHorizontal: spacing.md,
                borderLeftWidth: 4,
                borderLeftColor: item.color || colors.primary,
                ...shadows.sm,
                opacity: isActive ? 0.9 : 1,
                transform: [{ scale: isActive ? 1.02 : 1 }],
            },
            dragHandle: {
                paddingHorizontal: spacing.xs,
                paddingVertical: spacing.sm,
                marginRight: spacing.xs,
            },
            iconContainer: {
                width: 52,
                height: 52,
                borderRadius: 26,
                backgroundColor: `${item.color || colors.primary}15`,
                justifyContent: 'center',
                alignItems: 'center',
                marginRight: spacing.md,
                borderWidth: 1.5,
                borderColor: `${item.color || colors.primary}30`,
            },
            content: {
                flex: 1,
                justifyContent: 'center',
            },
            categoryName: {
                fontSize: 17,
                fontWeight: '700',
                color: colors.text,
                marginBottom: spacing.xs,
                letterSpacing: 0.2,
            },
            categoryInfo: {
                flexDirection: 'row',
                alignItems: 'center',
                gap: spacing.xs,
                flexWrap: 'wrap',
            },
            badge: {
                paddingHorizontal: spacing.sm,
                paddingVertical: 2,
                borderRadius: borderRadius.sm,
                backgroundColor: item.isDefault ? colors.primary + '15' : colors.success + '15',
                borderWidth: 1,
                borderColor: item.isDefault ? colors.primary + '30' : colors.success + '30',
            },
            badgeText: {
                fontSize: 10,
                fontWeight: '700',
                color: item.isDefault ? colors.primary : colors.success,
                letterSpacing: 0.5,
            },
            expenseCount: {
                fontSize: 12,
                fontWeight: '600',
                color: colors.primary,
                backgroundColor: colors.primary + '10',
                paddingHorizontal: spacing.sm,
                paddingVertical: 2,
                borderRadius: borderRadius.sm,
            },
            actions: {
                flexDirection: 'row',
                alignItems: 'center',
                gap: spacing.xs,
                marginLeft: spacing.xs,
            },
            actionButton: {
                width: 36,
                height: 36,
                borderRadius: 18,
                justifyContent: 'center',
                alignItems: 'center',
                backgroundColor: colors.borderLight,
            },
            readOnlyText: {
                fontSize: 10,
                color: colors.subText,
                fontStyle: 'italic',
                fontWeight: '500',
                paddingHorizontal: spacing.sm,
            },
        });

        return (
            <ScaleDecorator>
                <TouchableOpacity
                    style={itemStyles.categoryItem}
                    onPress={() => handleCategoryPress(item)}
                    onLongPress={drag}
                    delayLongPress={500}
                    activeOpacity={0.7}
                    disabled={isActive}
                >
                    {/* Drag Handle - Visual indicator only */}
                    <View style={itemStyles.dragHandle}>
                        <Ionicons name="reorder-two" size={24} color={colors.subText} />
                    </View>

                    {/* Icon */}
                    <View style={itemStyles.iconContainer}>
                        {renderCategoryIcon(item)}
                    </View>

                    {/* Content */}
                    <View style={itemStyles.content}>
                        <Text style={itemStyles.categoryName}>{item.name}</Text>
                        <View style={itemStyles.categoryInfo}>
                            <View style={itemStyles.badge}>
                                <Text style={itemStyles.badgeText}>
                                    {item.isDefault ? 'DEFAULT' : 'CUSTOM'}
                                </Text>
                            </View>
                            {item.expenseCount > 0 && (
                                <Text style={itemStyles.expenseCount}>
                                    {item.expenseCount} exp.
                                </Text>
                            )}
                        </View>
                    </View>

                    {/* Actions */}
                    <View style={itemStyles.actions}>
                        {!item.isDefault ? (
                            <>
                                <TouchableOpacity
                                    style={itemStyles.actionButton}
                                    onPress={() => navigation.navigate('AddEditCategory', { category: item })}
                                >
                                    <Ionicons name="create-outline" size={20} color={colors.primary} />
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={itemStyles.actionButton}
                                    onPress={() => handleDeleteCategory(item)}
                                >
                                    <Ionicons
                                        name="trash-outline"
                                        size={20}
                                        color={item.expenseCount > 0 ? '#F97316' : '#EF4444'}
                                    />
                                </TouchableOpacity>
                            </>
                        ) : (
                            <Text style={{ fontSize: 11, color: colors.subText, fontStyle: 'italic', paddingHorizontal: spacing.sm }}>
                                Read-only
                            </Text>
                        )}
                    </View>
                </TouchableOpacity>
            </ScaleDecorator>
        );
    };

    const renderEmpty = () => (
        <EmptyState
            icon="grid-outline"
            title="No Categories"
            subtitle="Create custom categories to organize your transactions"
            action={
                <TouchableOpacity
                    style={[mainStyles.emptyButton, { backgroundColor: colors.primary }]}
                    onPress={handleAddCategory}
                >
                    <Text style={mainStyles.emptyButtonText}>Add Category</Text>
                </TouchableOpacity>
            }
        />
    );

    const renderLoading = () => (
        <View style={mainStyles.loadingContainer}>
            <SkeletonTransactionItem />
            <SkeletonTransactionItem />
            <SkeletonTransactionItem />
            <SkeletonTransactionItem />
            <SkeletonTransactionItem />
        </View>
    );

    const mainStyles = StyleSheet.create({
        container: {
            flex: 1,
            backgroundColor: colors.background,
        },
        header: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            paddingHorizontal: spacing.lg,
            paddingTop: 50,
            paddingBottom: spacing.md,
        },
        title: {
            fontSize: 28,
            fontWeight: 'bold',
            color: colors.text,
        },
        subtitle: {
            fontSize: 14,
            color: colors.subText,
            marginTop: spacing.xs,
        },
        addButton: {
            width: 40,
            height: 40,
            borderRadius: 20,
            backgroundColor: colors.primary,
            justifyContent: 'center',
            alignItems: 'center',
            ...shadows.md,
        },
        emptyButton: {
            paddingHorizontal: 24,
            paddingVertical: 12,
            borderRadius: 12,
        },
        emptyButtonText: {
            color: '#ffffff',
            fontSize: 16,
            fontWeight: '600',
        },
        loadingContainer: {
            padding: spacing.lg,
        },
        listContent: {
            // Dynamic padding: tab bar height + safe area bottom + extra spacing
            paddingBottom: (Platform.OS === 'ios' ? 88 : 85) + insets.bottom + spacing.lg,
        },
    });

    if (loading) {
        return (
            <View style={mainStyles.container}>
                <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
                <View style={mainStyles.header}>
                    <View>
                        <Text style={mainStyles.title}>Categories</Text>
                    </View>
                </View>
                {renderLoading()}
            </View>
        );
    }

    return (
        <GestureHandlerRootView style={mainStyles.container}>
            <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

            {/* Header */}
            <View style={mainStyles.header}>
                <View>
                    <Text style={mainStyles.title}>Categories</Text>
                    <Text style={mainStyles.subtitle}>Long press to reorder</Text>
                </View>
                <TouchableOpacity style={mainStyles.addButton} onPress={handleAddCategory}>
                    <Ionicons name="add" size={24} color="#ffffff" />
                </TouchableOpacity>
            </View>

            {/* Categories List with Drag & Drop */}
            <DraggableFlatList
                data={categories}
                renderItem={renderCategory}
                keyExtractor={(item) => item._id}
                onDragEnd={handleDragEnd}
                activationDistance={10}
                autoscrollSpeed={100}
                autoscrollThreshold={80}
                ListEmptyComponent={renderEmpty}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        tintColor={colors.primary}
                        colors={[colors.primary]}
                    />
                }
                contentContainerStyle={mainStyles.listContent}
            />
        </GestureHandlerRootView>
    );
}

export default CategoriesScreen;
