import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, StatusBar, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import EmptyState from '../components/EmptyState';

function SearchScreen({ navigation }) {
    const { colors, isDark } = useTheme();
    const [query, setQuery] = useState('');

    const styles = StyleSheet.create({
        container: {
            flex: 1,
            backgroundColor: colors.background,
            paddingHorizontal: 20,
            paddingTop: 50,
        },
        header: {
            flexDirection: 'row',
            alignItems: 'center',
            marginBottom: 20,
        },
        backButton: {
            width: 36,
            height: 36,
            borderRadius: 18,
            justifyContent: 'center',
            alignItems: 'center',
            marginRight: 12,
            backgroundColor: colors.card,
            borderWidth: 1,
            borderColor: colors.border,
        },
        title: {
            fontSize: 28,
            fontWeight: '300', // Sohne thin display
            color: colors.text,
            letterSpacing: -0.64,
        },
        searchBox: {
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: colors.card,
            borderWidth: 1,
            borderColor: colors.inputBorder || '#a8c3de',
            borderRadius: 6, // Stripe text-input (6px)
            paddingHorizontal: 14,
            paddingVertical: 10,
            marginBottom: 24,
        },
        input: {
            flex: 1,
            fontSize: 15,
            fontWeight: '300',
            color: colors.text,
            marginLeft: 8,
        },
    });

    return (
        <View style={styles.container}>
            <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
            <View style={styles.header}>
                <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
                    <Ionicons name="arrow-back" size={20} color={colors.text} />
                </TouchableOpacity>
                <Text style={styles.title}>Search</Text>
            </View>

            <View style={styles.searchBox}>
                <Ionicons name="search" size={18} color={colors.subText} />
                <TextInput
                    style={styles.input}
                    placeholder="Search by amount, category, or notes..."
                    placeholderTextColor={colors.subText}
                    value={query}
                    onChangeText={setQuery}
                    autoFocus
                />
                {query.length > 0 && (
                    <TouchableOpacity onPress={() => setQuery('')}>
                        <Ionicons name="close-circle" size={18} color={colors.subText} />
                    </TouchableOpacity>
                )}
            </View>

            <EmptyState
                icon="search-outline"
                title={query ? 'No matching transactions' : 'Search Transactions'}
                subtitle={query ? `No transactions found matching "${query}"` : 'Type a category, amount, or keyword to find expenses'}
            />
        </View>
    );
}

export default SearchScreen;
