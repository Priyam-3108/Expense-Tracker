import React, { useState } from 'react';
import { View, Text, StyleSheet, StatusBar, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import hapticFeedback from '../utils/haptics';

function ExportDataScreen({ navigation }) {
    const { colors, isDark } = useTheme();
    const [exportFormat, setExportFormat] = useState('csv');

    const handleExport = () => {
        hapticFeedback.medium();
        Alert.alert('Export Started', `Exporting transactions in ${exportFormat.toUpperCase()} format.`);
    };

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
            marginBottom: 24,
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
        card: {
            backgroundColor: colors.card,
            borderRadius: 12, // Stripe rounded.lg
            padding: 20,
            borderWidth: 1,
            borderColor: colors.border,
            marginBottom: 20,
        },
        label: {
            fontSize: 14,
            fontWeight: '300',
            color: colors.text,
            marginBottom: 16,
            letterSpacing: -0.2,
        },
        optionRow: {
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingVertical: 14,
            borderBottomWidth: 1,
            borderBottomColor: colors.border,
        },
        optionText: {
            fontSize: 15,
            fontWeight: '300',
            color: colors.text,
        },
        exportButton: {
            backgroundColor: colors.primary || '#533afd',
            paddingVertical: 12,
            paddingHorizontal: 20,
            borderRadius: 9999, // Stripe button-primary-pill
            alignItems: 'center',
            marginTop: 10,
        },
        exportButtonText: {
            color: '#ffffff',
            fontSize: 15,
            fontWeight: '400',
        },
    });

    return (
        <View style={styles.container}>
            <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
            <View style={styles.header}>
                <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
                    <Ionicons name="arrow-back" size={20} color={colors.text} />
                </TouchableOpacity>
                <Text style={styles.title}>Export Data</Text>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
                <View style={styles.card}>
                    <Text style={styles.label}>Select Export Format</Text>

                    {['csv', 'json', 'pdf'].map(fmt => (
                        <TouchableOpacity
                            key={fmt}
                            style={styles.optionRow}
                            onPress={() => {
                                hapticFeedback.light();
                                setExportFormat(fmt);
                            }}
                        >
                            <Text style={styles.optionText}>{fmt.toUpperCase()} File</Text>
                            {exportFormat === fmt && (
                                <Ionicons name="checkmark-circle" size={20} color={colors.primary || '#533afd'} />
                            )}
                        </TouchableOpacity>
                    ))}
                </View>

                <TouchableOpacity style={styles.exportButton} onPress={handleExport}>
                    <Text style={styles.exportButtonText}>Download Export File</Text>
                </TouchableOpacity>
            </ScrollView>
        </View>
    );
}

export default ExportDataScreen;
