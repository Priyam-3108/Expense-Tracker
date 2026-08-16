import React, { useContext } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, StatusBar } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
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
            borderBottomWidth: 1,
            borderBottomColor: colors.border,
            ...shadows.sm,
        },
        profileSection: {
            alignItems: 'center',
            marginBottom: spacing.xs,
        },
        avatarGradient: {
            width: 80,
            height: 80,
            borderRadius: 40,
            justifyContent: 'center',
            alignItems: 'center',
            marginBottom: spacing.sm,
        },
        avatarText: {
            fontSize: 26,
            fontWeight: '300', // Sohne thin display
            color: '#ffffff',
        },
        userName: {
            fontSize: 24,
            fontWeight: '300', // Sohne thin display style
            color: colors.text,
            marginBottom: 2,
            letterSpacing: -0.64,
        },
        userEmail: {
            fontSize: 13,
            fontWeight: '300',
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
            fontSize: 11,
            fontWeight: '600',
            color: colors.subText,
            textTransform: 'uppercase',
            letterSpacing: 0.8,
            marginBottom: spacing.xs,
        },
        menuItem: {
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: colors.card,
            padding: 14,
            borderRadius: borderRadius.lg,
            marginBottom: spacing.xs,
            borderWidth: 1,
            borderColor: colors.border,
            ...shadows.sm,
        },
        iconContainer: {
            width: 38,
            height: 38,
            borderRadius: 19,
            backgroundColor: colors.primarySubdued,
            justifyContent: 'center',
            alignItems: 'center',
            marginRight: spacing.md,
        },
        menuContent: {
            flex: 1,
        },
        menuTitle: {
            fontSize: 15,
            fontWeight: '300', // Sohne thin style
            color: colors.text,
            marginBottom: 1,
            letterSpacing: -0.2,
        },
        menuSubtitle: {
            fontSize: 12,
            fontWeight: '300',
            color: colors.subText,
        },
        toggle: {
            width: 44,
            height: 24,
            borderRadius: 12,
            padding: 2,
            justifyContent: 'center',
        },
        toggleThumb: {
            width: 20,
            height: 20,
            borderRadius: 10,
        },
        logoutButton: {
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: colors.danger || '#ea2261',
            paddingVertical: 12,
            paddingHorizontal: 20,
            borderRadius: 9999, // Stripe pill button
            marginHorizontal: spacing.lg,
            marginVertical: spacing.xl,
            ...shadows.md,
        },
        logoutText: {
            fontSize: 15,
            fontWeight: '400',
            color: '#ffffff',
            marginLeft: spacing.xs,
        },
        version: {
            textAlign: 'center',
            fontSize: 12,
            fontWeight: '300',
            color: colors.subText,
            marginBottom: spacing.xl,
            fontVariant: ['tabular-nums'],
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
            section: 'Organisation',
            items: [
                {
                    icon: 'grid-outline',
                    title: 'Categories',
                    subtitle: 'Manage expense categories',
                    onPress: () => {
                        hapticFeedback.light();
                        navigation.navigate('CategoriesList');
                    },
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
                    <LinearGradient
                        colors={['#7b68fe', '#533afd', '#4434d4']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.avatarGradient}
                    >
                        <Text style={styles.avatarText}>{getInitials(user?.name)}</Text>
                    </LinearGradient>
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
