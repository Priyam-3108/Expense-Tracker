import React, { useState, useEffect, useContext } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, Animated, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { SecurityContext } from '../context/SecurityContext';
import hapticFeedback from '../utils/haptics';

const { width } = Dimensions.get('window');

const LockScreen = () => {
    const { colors, isDark } = useTheme();
    const { unlockApp, unlockWithBiometrics, isBiometricsEnabled } = useContext(SecurityContext);

    const [pin, setPin] = useState('');
    const [error, setError] = useState(false);
    const [shakeAnimation] = useState(new Animated.Value(0));

    useEffect(() => {
        // Try biometric unlock on mount if enabled
        if (isBiometricsEnabled) {
            handleBiometricUnlock();
        }
    }, []);

    const handleBiometricUnlock = async () => {
        const success = await unlockWithBiometrics();
        if (success) {
            hapticFeedback.success();
        }
        // If fail, stay on PIN screen
    };

    const handlePress = (key) => {
        hapticFeedback.light();
        if (key === 'backspace') {
            setPin(prev => prev.slice(0, -1));
            setError(false);
            return;
        }

        if (pin.length < 6) { // Support up to 6, though usually 4 is standard? Request says "4 or 6". Let's assume dynamic or check length. Usually we just check on submit or auto-submit on length.
            // Let's assume 4 for now or just allow typing until max. 
            // Better UX: auto check at 4, if fail, auto check at 6? 
            // Or just check whenever length is 4 or 6.
            const newPin = pin + key;
            setPin(newPin);
            setError(false);

            if (newPin.length === 4 || newPin.length === 6) {
                // Attempt unlock
                checkPin(newPin);
            }
        }
    };

    const checkPin = async (inputPin) => {
        const success = await unlockApp(inputPin);
        if (success) {
            hapticFeedback.success();
            setPin('');
        } else {
            // Only error if length is 6, or if length is 4 and we know it's a 4 digit pin? 
            // We only have the hash, so we can't know length easily unless we store it.
            // But if it fails at 4, user might have a 6 digit pin.
            // If it fails at 6, it's definitely wrong.
            // Basic strategy: Check at 4. If fail, wait for more? 
            // But if user stops at 4, they expect feedback.
            // Let's just try unlock. If fail, and length is 4, user might continue typing.
            // If length is 6 and fail, then error.
            if (inputPin.length === 6) {
                triggerError();
            } else if (inputPin.length === 4) {
                // If 4 digits, we don't know if they want 6. 
                // We authenticated above. If it failed:
                // Don't show error immediately unless we know the pin is 4 digits.
                // For now, let's just wait for 6? 
                // Actually, common pattern: try unlock. If false, wait. 
                // But visual feedback is needed. 
                // Let's treat it as: if false, do nothing but allow typing up to 6.
                // If 6 and false, error.
            }
        }
    };

    // Improved Logic: We don't know if the user set a 4 or 6 digit PIN without storing metadata.
    // However, `unlockApp` returns boolean.
    // If true -> unlock.
    // If false -> incorrect.
    // UX Issue: If I have a 4 digit PIN, I type 4 digits. It unlocks.
    // If I have a 6 digit PIN, I type 4 digits. `unlockApp` returns false. I continue to type 2 more. Unlocks.
    // If I type Wrong 4 digits (but I have 4 digit PIN). `unlockApp` returns false. I might wait.
    // Simple fix: Always check `unlockApp` when length is 4 or 6. 
    // If 4 fails, do nothing visually (maybe subtle shake usually implies wrong, but here it might imply "keep typing").
    // If 6 fails, definitely error.

    // Correction: `unlockApp` is async. 
    // Let's modify:
    // If length is 4: check. If true, unlock. If false, do nothing.
    // If length is 6: check. If true, unlock. If false, ERROR (shake & clear).

    // What if user enters wrong 4 digit PIN and stops?
    // We need a "Enter" button OR we just assume if they stop typing it's wrong? 
    // Or we add a "bio" button and "delete" button.

    // Decision: Check at 4. If success, great. 
    // Check at 6. If success, great. If fail, Error.
    const attemptUnlock = async (input) => {
        const result = await unlockApp(input);
        return result;
    };

    // We need to wrap the verify inside handlePress to be responsive
    // But verify is async.
    useEffect(() => {
        if (pin.length === 4) {
            unlockApp(pin).then(success => {
                if (success) {
                    hapticFeedback.success();
                    // unlockApp handles state change
                }
                // if fail, don't clear yet, might be 6 digits
            });
        } else if (pin.length === 6) {
            unlockApp(pin).then(success => {
                if (success) {
                    hapticFeedback.success();
                } else {
                    triggerError();
                }
            });
        }
    }, [pin]);

    const triggerError = () => {
        hapticFeedback.error();
        setError(true);
        Animated.sequence([
            Animated.timing(shakeAnimation, { toValue: 10, duration: 50, useNativeDriver: true }),
            Animated.timing(shakeAnimation, { toValue: -10, duration: 50, useNativeDriver: true }),
            Animated.timing(shakeAnimation, { toValue: 10, duration: 50, useNativeDriver: true }),
            Animated.timing(shakeAnimation, { toValue: 0, duration: 50, useNativeDriver: true })
        ]).start();
        setTimeout(() => {
            setPin('');
            setError(false);
        }, 500);
    };

    const styles = StyleSheet.create({
        container: {
            flex: 1,
            backgroundColor: colors.background,
            alignItems: 'center',
            justifyContent: 'center',
        },
        title: {
            fontSize: 22,
            fontWeight: '600',
            color: colors.text,
            marginBottom: 40,
        },
        pinContainer: {
            flexDirection: 'row',
            marginBottom: 50,
        },
        dot: {
            width: 16,
            height: 16,
            borderRadius: 8,
            borderWidth: 1,
            borderColor: colors.text,
            marginHorizontal: 10,
        },
        dotFilled: {
            backgroundColor: colors.primary,
            borderColor: colors.primary,
        },
        dotError: {
            borderColor: colors.danger,
            backgroundColor: colors.danger,
        },
        keypad: {
            width: '100%',
            maxWidth: 300,
            flexDirection: 'row',
            flexWrap: 'wrap',
            justifyContent: 'center',
        },
        key: {
            width: 75,
            height: 75,
            borderRadius: 37.5,
            alignItems: 'center',
            justifyContent: 'center',
            margin: 10,
            backgroundColor: isDark ? '#333' : '#eee', // Subtle key background
        },
        keyText: {
            fontSize: 28,
            fontWeight: '600',
            color: colors.text,
        },
        transparentKey: {
            backgroundColor: 'transparent',
        },
        bioButton: {
            marginTop: 30,
            alignItems: 'center',
        },
        bioText: {
            color: colors.primary,
            marginTop: 8,
            fontSize: 14,
        }
    });

    const renderDot = (index) => {
        let style = [styles.dot];
        if (index < pin.length) style.push(styles.dotFilled);
        if (error) style.push(styles.dotError);
        return <View key={index} style={style} />;
    };

    return (
        <SafeAreaView style={styles.container}>
            <Text style={styles.title}>Enter PIN</Text>

            <Animated.View style={[styles.pinContainer, { transform: [{ translateX: shakeAnimation }] }]}>
                {/* Always show 4 dots initially? Or dynamic? 
                    Standard is usually 4 fixed dots or 6. 
                    Let's show 4 dots base, but if length > 4 add more? 
                    Simpler: Just show dots for typed chars + placeholders up to 4? 
                    Let's just show 4 placeholders. If typed > 4, show more?
                */}
                {[0, 1, 2, 3].map(i => renderDot(i))}
                {pin.length > 4 && [4, 5].map(i => renderDot(i))}
            </Animated.View>

            <View style={styles.keypad}>
                {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                    <TouchableOpacity
                        key={num}
                        style={styles.key}
                        onPress={() => handlePress(num.toString())}
                        activeOpacity={0.7}
                    >
                        <Text style={styles.keyText}>{num}</Text>
                    </TouchableOpacity>
                ))}

                {/* Biometric Button */}
                <TouchableOpacity
                    style={[styles.key, styles.transparentKey]}
                    onPress={handleBiometricUnlock}
                    disabled={!isBiometricsEnabled}
                >
                    {isBiometricsEnabled && (
                        <Ionicons name="finger-print" size={32} color={colors.primary} />
                    )}
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.key}
                    onPress={() => handlePress('0')}
                    activeOpacity={0.7}
                >
                    <Text style={styles.keyText}>0</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.key, styles.transparentKey]}
                    onPress={() => handlePress('backspace')}
                >
                    <Ionicons name="backspace-outline" size={30} color={colors.text} />
                </TouchableOpacity>
            </View>

            {/* Fallback/Forgot logic could go here */}
        </SafeAreaView>
    );
};

export default LockScreen;
