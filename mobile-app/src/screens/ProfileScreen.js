import React, { useContext } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, StatusBar } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AuthContext } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import hapticFeedback from '../utils/haptics';

function ProfileScreen({ navigation }) {
    const { user, signOut } = useContext(AuthContext);
    const { colors, isDark, toggleTheme, spacing, borderRadius, shadows } = useTheme();

    const handleLogout = () => {
        if (hapticFeedback && hapticFeedback.medium) {
            try { hapticFeedback.medium(); } catch (e) { }
        }
        if (signOut) signOut();
    };

    const styles = StyleSheet.create({
        container: {
            flex: 1,
            backgroundColor: colors.background,
        },
        header: {
            paddingHorizontal: spacing.lg,
            paddingTop: 50,
            paddingBottom: spacing.xl,
            backgroundColor: colors.card,
            ...shadows.md,
        },
        profileSection: {
            alignItems: 'center',
            marginBottom: spacing.md,
        },
        avatar: {
            width: 80,
            height: 80,
            borderRadius: 40,
            backgroundColor: colors.primary,
            justifyContent: 'center',
            alignItems: 'center',
            marginBottom: spacing.md,
        },
        avatarText: {
            fontSize: 32,
            fontWeight: 'bold',
            color: '#ffffff',
        },
        userName: {
            fontSize: 24,
            fontWeight: 'bold',
            color: colors.text,
            marginBottom: spacing.xs,
        },
        userEmail: {
            fontSize: 14,
            color: colors.subText,
        },
        content: {
            flex: 1,
        },
        section: {
            marginTop: spacing.lg,
            paddingHorizontal: spacing.lg,
        },
        sectionTitle: {
            fontSize: 13,
            fontWeight: '600',
            color: colors.subText,
            textTransform: 'uppercase',
            letterSpacing: 0.5,
            marginBottom: spacing.sm,
        },
        menuItem: {
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: colors.card,
            padding: spacing.md,
            borderRadius: borderRadius.md,
            marginBottom: spacing.sm,
            ...shadows.sm,
        },
        iconContainer: {
            width: 40,
            height: 40,
            borderRadius: 20,
            backgroundColor: `${colors.primary}20`,
            justifyContent: 'center',
            alignItems: 'center',
            marginRight: spacing.md,
        },
        menuContent: {
            flex: 1,
        },
        menuTitle: {
            fontSize: 16,
            fontWeight: '600',
            color: colors.text,
            marginBottom: 2,
        },
        menuSubtitle: {
            fontSize: 13,
            color: colors.subText,
        },
        toggle: {
            width: 50,
            height: 28,
            borderRadius: 14,
            padding: 2,
            justifyContent: 'center',
        },
        toggleThumb: {
            width: 24,
            height: 24,
            borderRadius: 12,
        },
        logoutButton: {
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: colors.danger,
            padding: spacing.md,
            borderRadius: borderRadius.md,
            marginHorizontal: spacing.lg,
            marginVertical: spacing.xl,
            ...shadows.md,
        },
        logoutText: {
            fontSize: 16,
            fontWeight: '600',
            color: '#ffffff',
            marginLeft: spacing.sm,
        },
        version: {
            textAlign: 'center',
            fontSize: 12,
            color: colors.subText,
            marginBottom: spacing.xl,
        },
    });

    const menuItems = [
        {
            section: 'Account',
            items: [
                {
                    icon: 'person-outline',
                    title: 'Profile Information',
                    subtitle: user?.email || 'Update your details',
                    onPress: () => {
                        hapticFeedback.light();
                        // Navigate to profile edit screen
                    },
                },
            ],
        },
        {
            section: 'Preferences',
            items: [
                {
                    icon: isDark ? 'sunny' : 'moon',
                    title: 'Theme',
                    subtitle: isDark ? 'Dark Mode' : 'Light Mode',
                    onPress: () => {
                        hapticFeedback.light();
                        toggleTheme(isDark ? 'light' : 'dark');
                    },
                    showChevron: false,
                    rightComponent: (
                        <TouchableOpacity
                            onPress={() => {
                                hapticFeedback.light();
                                toggleTheme(isDark ? 'light' : 'dark');
                            }}
                            style={[
                                styles.toggle,
                                {
                                    backgroundColor: isDark ? colors.primary : '#CBD5E1', // Active vs Inactive color
                                    alignItems: isDark ? 'flex-end' : 'flex-start' // Position thumb
                                }
                            ]}
                        >
                            <View style={[styles.toggleThumb, { backgroundColor: '#ffffff' }]} />
                        </TouchableOpacity>
                    ),
                },
            ],
        },
        {
            section: 'Budget & Goals',
            items: [
                {
                    icon: 'wallet-outline',
                    title: 'Budget Settings',
                    subtitle: 'Set monthly budgets',
                    onPress: () => {
                        hapticFeedback.light();
                        navigation.navigate('BudgetSettings');
                    },
                },
            ],
        },
        {
            section: 'Data',
            items: [
                {
                    icon: 'download-outline',
                    title: 'Export Data',
                    subtitle: 'Download your transactions',
                    onPress: () => {
                        hapticFeedback.light();
                        navigation.navigate('ExportData');
                    },
                },
            ],
        },
        {
            section: 'Security',
            items: [
                {
                    icon: 'lock-closed-outline',
                    title: 'App Lock',
                    subtitle: 'PIN & Biometric settings',
                    onPress: () => {
                        hapticFeedback.light();
                        navigation.navigate('AppLock');
                    },
                },
            ],
        },
    ];



    const getInitials = (name) => {
        if (!name) return 'U';
        const parts = name.split(' ');
        if (parts.length >= 2) {
            return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
        }
        return name[0].toUpperCase();
    };

    return (
        <View style={styles.container}>
            <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

            {/* Header with Profile */}
            <View style={styles.header}>
                <View style={styles.profileSection}>
                    <View style={styles.avatar}>
                        <Text style={styles.avatarText}>{getInitials(user?.name)}</Text>
                    </View>
                    <Text style={styles.userName}>{user?.name || 'User'}</Text>
                    <Text style={styles.userEmail}>{user?.email || 'user@example.com'}</Text>
                </View>
            </View>

            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                {menuItems.map((section, sectionIndex) => (
                    <View key={sectionIndex} style={styles.section}>
                        <Text style={styles.sectionTitle}>{section.section}</Text>
                        {section.items.map((item, itemIndex) => (
                            <TouchableOpacity
                                key={itemIndex}
                                style={styles.menuItem}
                                onPress={item.onPress}
                                activeOpacity={0.7}
                            >
                                <View style={styles.iconContainer}>
                                    <Ionicons name={item.icon} size={20} color={colors.primary} />
                                </View>
                                <View style={styles.menuContent}>
                                    <Text style={styles.menuTitle}>{item.title}</Text>
                                    <Text style={styles.menuSubtitle}>{item.subtitle}</Text>
                                </View>
                                {item.rightComponent || (
                                    item.showChevron !== false && (
                                        <Ionicons name="chevron-forward" size={20} color={colors.subText} />
                                    )
                                )}
                            </TouchableOpacity>
                        ))}
                    </View>
                ))}

                {/* Logout Button */}
                <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
                    <Ionicons name="log-out-outline" size={20} color="#ffffff" />
                    <Text style={styles.logoutText}>Logout</Text>
                </TouchableOpacity>

                <Text style={styles.version}>Version 1.0.0</Text>
            </ScrollView>
        </View>
    );
}

export default ProfileScreen;
