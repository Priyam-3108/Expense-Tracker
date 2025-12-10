import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { useTheme } from '../context/ThemeContext';

function SkeletonLoader({
    width = '100%',
    height = 20,
    borderRadius = 8,
    style
}) {
    const { colors } = useTheme();
    const shimmerAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.loop(
            Animated.sequence([
                Animated.timing(shimmerAnim, {
                    toValue: 1,
                    duration: 1000,
                    useNativeDriver: true,
                }),
                Animated.timing(shimmerAnim, {
                    toValue: 0,
                    duration: 1000,
                    useNativeDriver: true,
                }),
            ])
        ).start();
    }, []);

    const opacity = shimmerAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [0.3, 0.7],
    });

    return (
        <Animated.View
            style={[
                styles.skeleton,
                {
                    width,
                    height,
                    borderRadius,
                    backgroundColor: colors.border,
                    opacity,
                },
                style,
            ]}
        />
    );
}

// Preset skeleton components
export function SkeletonCard() {
    const { spacing, borderRadius } = useTheme();
    return (
        <View style={{ marginBottom: spacing.md }}>
            <SkeletonLoader height={120} borderRadius={borderRadius.lg} />
        </View>
    );
}

export function SkeletonTransactionItem() {
    const { colors, spacing, borderRadius } = useTheme();
    return (
        <View style={[styles.transactionItem, {
            backgroundColor: colors.card,
            borderRadius: borderRadius.md,
            marginBottom: spacing.sm,
            padding: spacing.md,
        }]}>
            <SkeletonLoader width={48} height={48} borderRadius={24} />
            <View style={{ flex: 1, marginLeft: spacing.md }}>
                <SkeletonLoader width="60%" height={16} style={{ marginBottom: 8 }} />
                <SkeletonLoader width="40%" height={12} />
            </View>
            <SkeletonLoader width={80} height={20} />
        </View>
    );
}

const styles = StyleSheet.create({
    skeleton: {},
    transactionItem: {
        flexDirection: 'row',
        alignItems: 'center',
    },
});

export default SkeletonLoader;
