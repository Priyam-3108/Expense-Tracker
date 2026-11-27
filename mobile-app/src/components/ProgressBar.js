import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import Amount from './Amount';

function ProgressBar({
    progress = 0, // 0 to 1
    label,
    amount,
    budget,
    showPercentage = true,
    height = 8,
}) {
    const { colors, spacing, borderRadius } = useTheme();
    const animatedWidth = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.spring(animatedWidth, {
            toValue: progress,
            tension: 40,
            friction: 7,
            useNativeDriver: false,
        }).start();
    }, [progress]);

    const getProgressColor = () => {
        if (progress < 0.5) return colors.success;
        if (progress < 0.8) return colors.warning;
        return colors.danger;
    };

    const progressColor = getProgressColor();
    const percentage = Math.min(Math.round(progress * 100), 100);

    const widthInterpolation = animatedWidth.interpolate({
        inputRange: [0, 1],
        outputRange: ['0%', '100%'],
    });

    const styles = StyleSheet.create({
        container: {
            marginBottom: spacing.md,
        },
        header: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: spacing.sm,
        },
        label: {
            fontSize: 14,
            fontWeight: '400',
            color: colors.text,
            letterSpacing: -0.2,
        },
        amounts: {
            flexDirection: 'row',
            alignItems: 'center',
            gap: 4,
        },
        amount: {
            fontSize: 13,
            fontWeight: '400',
            color: progressColor,
            fontVariant: ['tabular-nums'],
        },
        budget: {
            fontSize: 13,
            color: colors.subText,
            fontVariant: ['tabular-nums'],
        },
        progressContainer: {
            height,
            backgroundColor: colors.borderLight,
            borderRadius: 8,
            overflow: 'hidden',
        },
        progressBar: {
            height: '100%',
            backgroundColor: progressColor,
            borderRadius: 8,
        },
        footer: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginTop: spacing.xs,
        },
        percentage: {
            fontSize: 12,
            fontWeight: '400',
            color: progressColor,
            fontVariant: ['tabular-nums'],
        },
        remaining: {
            fontSize: 12,
            color: colors.subText,
            fontVariant: ['tabular-nums'],
        },
    });

    const remaining = budget - amount;

    return (
        <View style={styles.container}>
            {label && (
                <View style={styles.header}>
                    <Text style={styles.label}>{label}</Text>
                    {amount !== undefined && budget !== undefined && (
                        <View style={styles.amounts}>
                            <Amount value={amount} currency="INR" style={styles.amount} />
                            <Text style={styles.budget}>/ </Text>
                            <Amount value={budget} currency="INR" style={styles.budget} />
                        </View>
                    )}
                </View>
            )}

            <View style={styles.progressContainer}>
                <Animated.View
                    style={[
                        styles.progressBar,
                        { width: widthInterpolation }
                    ]}
                />
            </View>

            {showPercentage && (
                <View style={styles.footer}>
                    <Text style={styles.percentage}>{percentage}% used</Text>
                    {remaining > 0 && (
                        <Text style={styles.remaining}>
                            <Amount value={remaining} currency="INR" style={styles.remaining} /> remaining
                        </Text>
                    )}
                    {remaining <= 0 && (
                        <Text style={[styles.remaining, { color: colors.danger }]}>
                            Over budget by <Amount value={Math.abs(remaining)} currency="INR" style={[styles.remaining, { color: colors.danger }]} />
                        </Text>
                    )}
                </View>
            )}
        </View>
    );
}

export default ProgressBar;
