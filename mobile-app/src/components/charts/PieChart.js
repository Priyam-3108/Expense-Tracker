import React from 'react';
import { View, Text, Dimensions, StyleSheet } from 'react-native';
// Deep import to bypass index.js resolution issues
import RNPieChart from 'react-native-chart-kit/dist/PieChart.js';
import { useTheme } from '../../context/ThemeContext';

const screenWidth = Dimensions.get('window').width;

function PieChart({ data, height = 240, width, showLegend = true }) {
    const { colors, isDark } = useTheme();

    const chartConfig = {
        color: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
    };

    // Use provided width or calculate from screen (reduced padding for more compact view)
    const chartWidth = width || (Dimensions.get('window').width - 60);

    // Transform data to include colors and better legend styling with improved spacing
    const chartData = data?.map((item, index) => ({
        ...item,
        color: item.color || colors.categoryColors?.[item.name?.toLowerCase()] || getColorByIndex(index),
        legendFontColor: colors.text,
        legendFontSize: 11,
    })) || [];

    function getColorByIndex(index) {
        const colorPalette = [
            '#f59e0b', '#3b82f6', '#ec4899', '#8b5cf6',
            '#10b981', '#ef4444', '#6366f1', '#14b8a6'
        ];
        return colorPalette[index % colorPalette.length];
    }

    // Validate data
    if (!chartData || chartData.length === 0) {
        return (
            <View style={styles.container}>
                <View style={[styles.errorContainer, { backgroundColor: colors.card }]}>
                    <Text style={{ color: colors.text }}>No data available</Text>
                </View>
            </View>
        );
    }

    try {
        return (
            <View style={styles.container}>
                <RNPieChart
                    data={chartData}
                    width={chartWidth}
                    height={height}
                    chartConfig={chartConfig}
                    accessor="population"
                    backgroundColor="transparent"
                    paddingLeft="0"
                    absolute
                    hasLegend={showLegend}
                    style={styles.chart}
                    avoidFalseZero
                />
            </View>
        );
    } catch (error) {
        console.error('PieChart render error:', error);
        return (
            <View style={styles.container}>
                <View style={[styles.errorContainer, { backgroundColor: colors.card }]}>
                    <Text style={{ color: colors.text }}>Unable to load chart</Text>
                </View>
            </View>
        );
    }
}

const styles = StyleSheet.create({
    container: {
        alignItems: 'center',
        marginVertical: 8,
    },
    chart: {
        borderRadius: 16,
    },
    errorContainer: {
        padding: 20,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 220,
    },
});

export default PieChart;
