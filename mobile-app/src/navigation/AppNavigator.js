import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import { Platform, TouchableOpacity } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import hapticFeedback from '../utils/haptics';

// Import Screens
import DashboardScreen from '../screens/DashboardScreen';
import AddExpenseScreen from '../screens/AddExpenseScreen';
import AnalyticsScreen from '../screens/AnalyticsScreen';
import CategoriesScreen from '../screens/CategoriesScreen';
import ProfileScreen from '../screens/ProfileScreen';
import AddEditCategoryScreen from '../screens/AddEditCategoryScreen';
import BudgetSettingsScreen from '../screens/BudgetSettingsScreen';
import ExportDataScreen from '../screens/ExportDataScreen';
import AppLockScreen from '../screens/AppLockScreen';
import SearchScreen from '../screens/SearchScreen';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

// Dashboard Stack
function DashboardStack() {
    return (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
            <Stack.Screen name="DashboardMain" component={DashboardScreen} />
            <Stack.Screen name="Search" component={SearchScreen} />
        </Stack.Navigator>
    );
}

// Categories Stack
function CategoriesStack() {
    return (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
            <Stack.Screen name="CategoriesList" component={CategoriesScreen} />
            <Stack.Screen name="AddEditCategory" component={AddEditCategoryScreen} />
        </Stack.Navigator>
    );
}

// Profile Stack
function ProfileStack() {
    return (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
            <Stack.Screen name="ProfileMain" component={ProfileScreen} />
            <Stack.Screen name="BudgetSettings" component={BudgetSettingsScreen} />
            <Stack.Screen name="ExportData" component={ExportDataScreen} />
            <Stack.Screen name="AppLock" component={AppLockScreen} />
        </Stack.Navigator>
    );
}

function AppNavigator() {
    const { colors, isDark } = useTheme();

    return (
        <Tab.Navigator
            screenOptions={({ route }) => ({
                headerShown: false,
                tabBarIcon: ({ focused, color, size }) => {
                    let iconName;

                    if (route.name === 'Dashboard') {
                        iconName = focused ? 'home' : 'home-outline';
                    } else if (route.name === 'AddExpense') {
                        iconName = focused ? 'add-circle' : 'add-circle-outline';
                    } else if (route.name === 'Analytics') {
                        iconName = focused ? 'bar-chart' : 'bar-chart-outline';
                    } else if (route.name === 'Categories') {
                        iconName = focused ? 'grid' : 'grid-outline';
                    } else if (route.name === 'Profile') {
                        iconName = focused ? 'person' : 'person-outline';
                    }

                    return <Ionicons name={iconName} size={size} color={color} />;
                },
                tabBarActiveTintColor: colors.primary,
                tabBarInactiveTintColor: colors.subText,
                tabBarStyle: {
                    backgroundColor: colors.card,
                    borderTopColor: colors.border,
                    borderTopWidth: 1,
                    height: Platform.OS === 'ios' ? 88 : 65,
                    paddingBottom: Platform.OS === 'ios' ? 28 : 10,
                    paddingTop: 8,
                    elevation: 8,
                    shadowColor: colors.shadow,
                    shadowOffset: { width: 0, height: -2 },
                    shadowOpacity: 1,
                    shadowRadius: 8,
                },
                tabBarLabelStyle: {
                    fontSize: 12,
                    fontWeight: '600',
                },
                tabBarButton: (props) => (
                    <TouchableOpacity
                        {...props}
                        onPress={(e) => {
                            hapticFeedback.light();
                            props.onPress(e);
                        }}
                    />
                ),
            })}
        >
            <Tab.Screen
                name="Dashboard"
                component={DashboardStack}
                options={{ tabBarLabel: 'Home' }}
            />
            <Tab.Screen
                name="Analytics"
                component={AnalyticsScreen}
                options={{ tabBarLabel: 'Analytics' }}
            />
            <Tab.Screen
                name="AddExpense"
                component={AddExpenseScreen}
                options={{
                    tabBarLabel: 'Add',
                    tabBarIconStyle: { marginTop: -5 },
                }}
            />
            <Tab.Screen
                name="Categories"
                component={CategoriesStack}
                options={{ tabBarLabel: 'Categories' }}
            />
            <Tab.Screen
                name="Profile"
                component={ProfileStack}
                options={{ tabBarLabel: 'Profile' }}
            />
        </Tab.Navigator>
    );
}

export default AppNavigator;
