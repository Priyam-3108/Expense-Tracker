import React from 'react';
import { View, Text, StyleSheet, StatusBar } from 'react-native';
import { useTheme } from '../context/ThemeContext';

function ExportDataScreen() {
    const { colors, isDark } = useTheme();

    const styles = StyleSheet.create({
        container: {
            flex: 1,
            backgroundColor: colors.background,
            padding: 20,
        },
        title: {
            fontSize: 24,
            fontWeight: 'bold',
            color: colors.text,
            marginBottom: 20,
        },
    });

    return (
        <View style={styles.container}>
            <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
            <Text style={styles.title}>Export Data</Text>
        </View>
    );
}

export default ExportDataScreen;
