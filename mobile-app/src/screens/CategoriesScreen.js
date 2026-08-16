import React, { useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, StatusBar, RefreshControl, Alert, Platform } from 'react-native';
import { useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
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
                cats = cats.map(c => ({
                    ...c,
                    name: c.name || 'Unnamed',
                    icon: c.icon || '💰',
                    color: c.color || '#533afd'
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
            ? `Delete "${category.name}"? It has ${category.expenseCount} expense(s). Reassign them first.`
            : `Delete "${category.name}"? This cannot be undone.`;

        Alert.alert('Delete Category', message, [
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
                            fetchCategories();
                        } else {
                            hapticFeedback.error();
                            Alert.alert('Error', response?.data?.message || 'Failed to delete');
                        }
                    } catch (error) {
                        hapticFeedback.error();
                        Alert.alert('Error', error.response?.data?.message || 'Failed to delete category');
                    }
                }
            }
        ]);
    };

    const handleDragEnd = async ({ data }) => {
        setCategories(data);
        hapticFeedback.medium();
        try {
            const newOrder = data.map(cat => cat._id);
            await categoryService.updateCategoryOrder(newOrder);
            hapticFeedback.success();
        } catch (error) {
            hapticFeedback.error();
            Alert.alert('Error', 'Failed to save category order');
            fetchCategories();
        }
    };

    const renderCategoryIcon = (item) => {
        const icon = item.icon;
        if (icon && [...icon].length <= 2) {
            return <Text style={{ fontSize: 22 }}>{icon}</Text>;
        }
        if (icon && icon.length > 2) {
            return <Ionicons name={icon} size={22} color="#ffffff" />;
        }
        return (
            <Text style={{ fontSize: 18, fontWeight: '600', color: '#ffffff' }}>
                {(item.name || '?').charAt(0).toUpperCase()}
            </Text>
        );
    };

    const renderCategory = ({ item, drag, isActive }) => {
        const catColor = item.color || colors.primary;

        return (
            <ScaleDecorator>
                <TouchableOpacity
                    onPress={() => handleCategoryPress(item)}
                    onLongPress={drag}
                    delayLongPress={400}
                    activeOpacity={0.75}
                    disabled={isActive}
                    style={[
                        styles.catCard,
                        {
                            backgroundColor: isActive ? colors.cardElevated : colors.card,
                            borderColor: isActive ? catColor + '60' : colors.border,
                            transform: [{ scale: isActive ? 1.02 : 1 }],
                            ...shadows.sm,
                        }
                    ]}
                >
                    {/* Left accent line */}
                    <View style={[styles.accentLine, { backgroundColor: catColor }]} />

                    {/* Icon pill */}
                    <LinearGradient
                        colors={[catColor + 'dd', catColor]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.iconGradient}
                    >
                        {renderCategoryIcon(item)}
                    </LinearGradient>

                    {/* Text block */}
                    <View style={styles.catContent}>
                        <Text style={[styles.catName, { color: colors.text }]} numberOfLines={1}>
                            {item.name}
                        </Text>
                        <View style={styles.catMeta}>
                            {item.isDefault ? (
                                <View style={[styles.pill, { backgroundColor: colors.primarySubdued }]}>
                                    <Text style={[styles.pillText, { color: colors.primary }]}>Default</Text>
                                </View>
                            ) : (
                                <View style={[styles.pill, { backgroundColor: colors.successBg || '#ecfdf5' }]}>
                                    <Text style={[styles.pillText, { color: colors.success }]}>Custom</Text>
                                </View>
                            )}
                            {item.expenseCount > 0 && (
                                <View style={[styles.pill, { backgroundColor: colors.borderLight }]}>
                                    <Text style={[styles.pillText, { color: colors.subText }]}>
                                        {item.expenseCount} txn{item.expenseCount !== 1 ? 's' : ''}
                                    </Text>
                                </View>
                            )}
                        </View>
                    </View>

                    {/* Right actions */}
                    <View style={styles.catActions}>
                        {!item.isDefault ? (
                            <>
                                <TouchableOpacity
                                    style={[styles.actionBtn, { backgroundColor: colors.primarySubdued }]}
                                    onPress={() => navigation.navigate('AddEditCategory', { category: item })}
                                >
                                    <Ionicons name="pencil" size={14} color={colors.primary} />
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={[styles.actionBtn, { backgroundColor: colors.dangerBg || '#fff0f5' }]}
                                    onPress={() => handleDeleteCategory(item)}
                                >
                                    <Ionicons name="trash-outline" size={14} color={colors.danger} />
                                </TouchableOpacity>
                            </>
                        ) : (
                            <View style={[styles.actionBtn, { backgroundColor: colors.borderLight }]}>
                                <Ionicons name="lock-closed-outline" size={14} color={colors.subText} />
                            </View>
                        )}
                        <View style={[styles.dragHandle, { backgroundColor: colors.borderLight }]}>
                            <Ionicons name="menu" size={14} color={colors.subText} />
                        </View>
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
                    style={[styles.emptyButton, { backgroundColor: colors.primary }]}
                    onPress={handleAddCategory}
                >
                    <Ionicons name="add" size={16} color="#ffffff" style={{ marginRight: 6 }} />
                    <Text style={styles.emptyButtonText}>Add Category</Text>
                </TouchableOpacity>
            }
        />
    );

    const renderLoading = () => (
        <View style={{ padding: spacing.lg }}>
            <SkeletonTransactionItem />
            <SkeletonTransactionItem />
            <SkeletonTransactionItem />
            <SkeletonTransactionItem />
            <SkeletonTransactionItem />
        </View>
    );

    const renderListHeader = () => (
        <View style={[styles.listHeader, { borderBottomColor: colors.border }]}>
            <Text style={[styles.listHeaderText, { color: colors.subText }]}>
                {categories.length} {categories.length === 1 ? 'category' : 'categories'} · Long press to reorder
            </Text>
        </View>
    );

    const styles = StyleSheet.create({
        container: {
            flex: 1,
            backgroundColor: colors.background,
        },
        header: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            paddingHorizontal: 20,
            paddingTop: 50,
            paddingBottom: 16,
        },
        titleBlock: {
            flex: 1,
        },
        title: {
            fontSize: 32,
            fontWeight: '300',
            color: colors.text,
            letterSpacing: -0.64,
        },
        addButton: {
            flexDirection: 'row',
            alignItems: 'center',
            gap: 6,
            backgroundColor: colors.primary,
            paddingHorizontal: 14,
            paddingVertical: 9,
            borderRadius: 9999,
            ...shadows.md,
        },
        addButtonText: {
            color: '#ffffff',
            fontSize: 14,
            fontWeight: '500',
        },
        listHeader: {
            paddingHorizontal: 20,
            paddingVertical: 10,
            borderBottomWidth: 1,
            marginBottom: 8,
        },
        listHeaderText: {
            fontSize: 12,
            fontWeight: '400',
            letterSpacing: 0.1,
        },
        catCard: {
            flexDirection: 'row',
            alignItems: 'center',
            borderRadius: 14,
            marginBottom: 10,
            marginHorizontal: 16,
            borderWidth: 1,
            overflow: 'hidden',
        },
        accentLine: {
            width: 4,
            alignSelf: 'stretch',
        },
        iconGradient: {
            width: 46,
            height: 46,
            borderRadius: 12,
            justifyContent: 'center',
            alignItems: 'center',
            margin: 12,
        },
        catContent: {
            flex: 1,
            paddingVertical: 12,
        },
        catName: {
            fontSize: 16,
            fontWeight: '400',
            marginBottom: 5,
            letterSpacing: -0.2,
        },
        catMeta: {
            flexDirection: 'row',
            gap: 6,
            flexWrap: 'wrap',
        },
        pill: {
            paddingHorizontal: 8,
            paddingVertical: 2,
            borderRadius: 9999,
        },
        pillText: {
            fontSize: 11,
            fontWeight: '500',
        },
        catActions: {
            flexDirection: 'row',
            alignItems: 'center',
            gap: 6,
            paddingRight: 12,
        },
        actionBtn: {
            width: 30,
            height: 30,
            borderRadius: 15,
            justifyContent: 'center',
            alignItems: 'center',
        },
        dragHandle: {
            width: 30,
            height: 30,
            borderRadius: 15,
            justifyContent: 'center',
            alignItems: 'center',
        },
        emptyButton: {
            flexDirection: 'row',
            alignItems: 'center',
            paddingHorizontal: 20,
            paddingVertical: 11,
            borderRadius: 9999,
        },
        emptyButtonText: {
            color: '#ffffff',
            fontSize: 15,
            fontWeight: '400',
        },
        listContent: {
            paddingBottom: (Platform.OS === 'ios' ? 88 : 85) + insets.bottom + 16,
        },
    });

    if (loading) {
        return (
            <View style={styles.container}>
                <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
                <View style={styles.header}>
                    <View style={styles.titleBlock}>
                        <Text style={styles.title}>Categories</Text>
                    </View>
                </View>
                {renderLoading()}
            </View>
        );
    }

    return (
        <GestureHandlerRootView style={styles.container}>
            <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

            {/* Header */}
            <View style={styles.header}>
                <View style={styles.titleBlock}>
                    <Text style={styles.title}>Categories</Text>
                </View>
                <TouchableOpacity style={styles.addButton} onPress={handleAddCategory}>
                    <Ionicons name="add" size={18} color="#ffffff" />
                    <Text style={styles.addButtonText}>New</Text>
                </TouchableOpacity>
            </View>

            {/* Category List */}
            <DraggableFlatList
                data={categories}
                renderItem={renderCategory}
                keyExtractor={(item) => item._id}
                onDragEnd={handleDragEnd}
                activationDistance={10}
                autoscrollSpeed={100}
                autoscrollThreshold={80}
                ListHeaderComponent={categories.length > 0 ? renderListHeader : null}
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
                contentContainerStyle={styles.listContent}
            />
        </GestureHandlerRootView>
    );
}

export default CategoriesScreen;
