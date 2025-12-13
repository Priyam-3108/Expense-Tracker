import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    StatusBar,
    TextInput,
    TouchableOpacity,
    ScrollView,
    Alert,
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { categoryService } from '../services/categoryService';
import hapticFeedback from '../utils/haptics';

// Icon options matching web app
const iconOptions = [
    '💰', '🍽️', '🏠', '✈️', '💳', '🛍️', '🚗', '🏥', '🎬', '📚', '⚡',
    '🍕', '☕', '🎮', '🏋️', '💄', '👕', '📱', '💻', '🎵', '🎨', '🌱'
];

// Color options matching web app
const colorOptions = [
    '#EF4444', '#F97316', '#F59E0B', '#84CC16', '#10B981',
    '#06B6D4', '#3B82F6', '#6366F1', '#8B5CF6', '#EC4899',
    '#F43F5E', '#A855F7', '#14B8A6', '#22C55E', '#EAB308'
];

function AddEditCategoryScreen({ navigation, route }) {
    const { colors, isDark, spacing, borderRadius, shadows } = useTheme();
    const category = route.params?.category;
    const isEditing = !!category;

    const [formData, setFormData] = useState({
        name: '',
        color: '#3B82F6',
        icon: '💰'
    });
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState({});

    useEffect(() => {
        if (isEditing && category) {
            setFormData({
                name: category.name || '',
                color: category.color || '#3B82F6',
                icon: category.icon || '💰'
            });
        }
    }, [category, isEditing]);

    const validateForm = () => {
        const newErrors = {};

        if (!formData.name.trim()) {
            newErrors.name = 'Category name is required';
        } else if (formData.name.trim().length > 30) {
            newErrors.name = 'Category name must be 30 characters or less';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async () => {
        if (!validateForm()) {
            hapticFeedback.error();
            return;
        }

        // Prevent editing default categories
        if (isEditing && category?.isDefault) {
            Alert.alert('Error', 'Cannot edit default categories');
            hapticFeedback.error();
            return;
        }

        setLoading(true);
        hapticFeedback.medium();

        try {
            if (isEditing) {
                const response = await categoryService.updateCategory(category._id, formData);

                // Check response structure
                const success = response?.data?.success !== false;

                if (success) {
                    hapticFeedback.success();
                    Alert.alert('Success', 'Category updated successfully', [
                        { text: 'OK', onPress: () => navigation.goBack() }
                    ]);
                } else {
                    const errorMsg = response?.data?.message || 'Failed to update category';
                    hapticFeedback.error();
                    Alert.alert('Error', errorMsg);
                }
            } else {
                const response = await categoryService.createCategory(formData);

                // Check response structure
                const success = response?.data?.success !== false;

                if (success) {
                    hapticFeedback.success();
                    Alert.alert('Success', 'Category created successfully', [
                        { text: 'OK', onPress: () => navigation.goBack() }
                    ]);
                } else {
                    const errorMsg = response?.data?.message || 'Failed to create category';
                    hapticFeedback.error();
                    Alert.alert('Error', errorMsg);
                }
            }
        } catch (error) {
            console.error('Error saving category:', error);
            const errorMessage = error.response?.data?.message || 'Failed to save category';
            hapticFeedback.error();
            Alert.alert('Error', errorMessage);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = () => {
        if (category?.isDefault) {
            Alert.alert('Error', 'Default categories cannot be deleted');
            hapticFeedback.error();
            return;
        }

        const hasExpenses = category?.expenseCount > 0;
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
                        setLoading(true);
                        hapticFeedback.medium();

                        try {
                            const response = await categoryService.deleteCategory(category._id);
                            const success = response?.data?.success !== false;

                            if (success) {
                                hapticFeedback.success();
                                Alert.alert('Success', 'Category deleted successfully', [
                                    { text: 'OK', onPress: () => navigation.goBack() }
                                ]);
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
                        } finally {
                            setLoading(false);
                        }
                    }
                }
            ]
        );
    };

    const styles = StyleSheet.create({
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
            backgroundColor: colors.background,
        },
        headerTitle: {
            fontSize: 24,
            fontWeight: 'bold',
            color: colors.text,
        },
        backButton: {
            width: 40,
            height: 40,
            borderRadius: 20,
            backgroundColor: colors.card,
            justifyContent: 'center',
            alignItems: 'center',
            ...shadows.sm,
        },
        deleteButton: {
            width: 40,
            height: 40,
            borderRadius: 20,
            backgroundColor: colors.card,
            justifyContent: 'center',
            alignItems: 'center',
            ...shadows.sm,
        },
        scrollContent: {
            padding: spacing.lg,
        },
        section: {
            marginBottom: spacing.xl,
        },
        label: {
            fontSize: 14,
            fontWeight: '600',
            color: colors.text,
            marginBottom: spacing.sm,
        },
        input: {
            backgroundColor: colors.card,
            borderRadius: borderRadius.md,
            padding: spacing.md,
            fontSize: 16,
            color: colors.text,
            borderWidth: 1,
            borderColor: colors.border,
            ...shadows.sm,
        },
        inputError: {
            borderColor: '#EF4444',
        },
        errorText: {
            color: '#EF4444',
            fontSize: 12,
            marginTop: spacing.xs,
        },
        iconGrid: {
            flexDirection: 'row',
            flexWrap: 'wrap',
            gap: spacing.sm,
        },
        iconButton: {
            width: 48,
            height: 48,
            borderRadius: borderRadius.md,
            justifyContent: 'center',
            alignItems: 'center',
            borderWidth: 2,
            borderColor: colors.border,
        },
        iconButtonSelected: {
            borderColor: colors.primary,
            backgroundColor: `${colors.primary}20`,
        },
        iconText: {
            fontSize: 24,
        },
        colorGrid: {
            flexDirection: 'row',
            flexWrap: 'wrap',
            gap: spacing.sm,
        },
        colorButton: {
            width: 48,
            height: 48,
            borderRadius: 24,
            borderWidth: 2,
            borderColor: colors.border,
        },
        colorButtonSelected: {
            borderColor: colors.text,
            borderWidth: 3,
        },
        saveButton: {
            backgroundColor: colors.primary,
            borderRadius: borderRadius.md,
            padding: spacing.md,
            alignItems: 'center',
            marginTop: spacing.lg,
            ...shadows.md,
        },
        saveButtonDisabled: {
            opacity: 0.5,
        },
        saveButtonText: {
            color: '#ffffff',
            fontSize: 16,
            fontWeight: '600',
        },
        loadingContainer: {
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
        },
        loadingText: {
            color: '#ffffff',
            fontSize: 16,
            fontWeight: '600',
            marginLeft: spacing.sm,
        },
    });

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
            <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
                    <Ionicons name="arrow-back" size={24} color={colors.text} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>
                    {isEditing ? 'Edit Category' : 'Add Category'}
                </Text>
                {isEditing && !category?.isDefault ? (
                    <TouchableOpacity style={styles.deleteButton} onPress={handleDelete}>
                        <Ionicons name="trash-outline" size={24} color="#EF4444" />
                    </TouchableOpacity>
                ) : (
                    <View style={{ width: 40 }} />
                )}
            </View>

            <ScrollView
                style={styles.container}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                {/* Category Name */}
                <View style={styles.section}>
                    <Text style={styles.label}>Category Name</Text>
                    <TextInput
                        style={[styles.input, errors.name && styles.inputError]}
                        value={formData.name}
                        onChangeText={(text) => {
                            setFormData({ ...formData, name: text });
                            if (errors.name) setErrors({ ...errors, name: null });
                        }}
                        placeholder="Enter category name"
                        placeholderTextColor={colors.subText}
                        maxLength={30}
                        editable={!loading}
                    />
                    {errors.name && <Text style={styles.errorText}>{errors.name}</Text>}
                </View>

                {/* Icon Selection */}
                <View style={styles.section}>
                    <Text style={styles.label}>Icon</Text>
                    <View style={styles.iconGrid}>
                        {iconOptions.map((icon) => (
                            <TouchableOpacity
                                key={icon}
                                style={[
                                    styles.iconButton,
                                    formData.icon === icon && styles.iconButtonSelected
                                ]}
                                onPress={() => {
                                    hapticFeedback.light();
                                    setFormData({ ...formData, icon });
                                }}
                                disabled={loading}
                            >
                                <Text style={styles.iconText}>{icon}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                {/* Color Selection */}
                <View style={styles.section}>
                    <Text style={styles.label}>Color</Text>
                    <View style={styles.colorGrid}>
                        {colorOptions.map((color) => (
                            <TouchableOpacity
                                key={color}
                                style={[
                                    styles.colorButton,
                                    { backgroundColor: color },
                                    formData.color === color && styles.colorButtonSelected
                                ]}
                                onPress={() => {
                                    hapticFeedback.light();
                                    setFormData({ ...formData, color });
                                }}
                                disabled={loading}
                            />
                        ))}
                    </View>
                </View>

                {/* Save Button */}
                <TouchableOpacity
                    style={[styles.saveButton, loading && styles.saveButtonDisabled]}
                    onPress={handleSubmit}
                    disabled={loading}
                >
                    {loading ? (
                        <View style={styles.loadingContainer}>
                            <ActivityIndicator color="#ffffff" />
                            <Text style={styles.loadingText}>
                                {isEditing ? 'Updating...' : 'Creating...'}
                            </Text>
                        </View>
                    ) : (
                        <Text style={styles.saveButtonText}>
                            {isEditing ? 'Update Category' : 'Create Category'}
                        </Text>
                    )}
                </TouchableOpacity>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

export default AddEditCategoryScreen;
