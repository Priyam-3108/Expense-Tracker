import React from 'react';
import { View, Text, Dimensions, StyleSheet } from 'react-native';
// Deep import to bypass index.js resolution issues
import RNLineChart from 'react-native-chart-kit/dist/line-chart/LineChart.js';
import { useTheme } from '../../context/ThemeContext';

const screenWidth = Dimensions.get('window').width;

function LineChart({ data, labels, height = 220, width }) {
    const { colors, isDark } = useTheme();

    // Validate data
    const validData = data && data.length > 0 ? data : [0];
    const validLabels = labels && labels.length > 0 ? labels : [''];

    // Use provided width or calculate from screen
    const chartWidth = width || (Dimensions.get('window').width - 40);

    const chartConfig = {
        backgroundColor: colors.card,
        backgroundGradientFrom: colors.card,
        backgroundGradientTo: colors.card,
        decimalPlaces: 0,
        color: (opacity = 1) => `rgba(139, 92, 246, ${opacity})`,
        labelColor: (opacity = 1) => isDark ? `rgba(241, 245, 249, ${opacity})` : `rgba(15, 23, 42, ${opacity})`,
        style: {
            borderRadius: 16,
        },
        propsForDots: {
            r: '5',
            strokeWidth: '2',
            stroke: '#8b5cf6',
        },
        propsForBackgroundLines: {
            strokeDasharray: '',
            stroke: colors.border,
            strokeWidth: 1,
        },
        propsForLabels: {
            fontSize: 11,
        },
    };

    const chartData = {
        labels: validLabels,
        datasets: [
            {
                data: validData,
                color: (opacity = 1) => `rgba(139, 92, 246, ${opacity})`,
                strokeWidth: 3,
            },
        ],
    };

    try {
        return (
            <View style={styles.container}>
                <RNLineChart
                    data={chartData}
                    width={chartWidth}
                    height={height}
                    chartConfig={chartConfig}
                    bezier
                    style={styles.chart}
                    yAxisLabel="₹"
                    yAxisSuffix=""
                    fromZero
                />
            </View>
        );
    } catch (error) {
        console.error('LineChart render error:', error);
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

export default LineChart;
