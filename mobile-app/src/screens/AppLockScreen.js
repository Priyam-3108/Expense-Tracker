import React, { useState, useContext, useEffect } from 'react';
import { View, Text, StyleSheet, Switch, TouchableOpacity, Alert, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { SecurityContext } from '../context/SecurityContext';
import { SecurityUtils } from '../utils/security';
import hapticFeedback from '../utils/haptics';

function AppLockScreen({ navigation }) {
    const { colors, isDark, spacing, borderRadius } = useTheme();
    const {
        isAppLockEnabled,
        isBiometricsEnabled,
        enableLock,
        disableLock,
        updateSettings,
        unlockApp // used to verify old pin
    } = useContext(SecurityContext);

    const [isBiometricSupported, setIsBiometricSupported] = useState(false);

    // Modal State for PIN Setup/Change
    const [showPinModal, setShowPinModal] = useState(false);
    const [pinMode, setPinMode] = useState('SETUP'); // SETUP, CHANGE_VERIFY, CHANGE_NEW
    const [pinStep, setPinStep] = useState('ENTER'); // ENTER, CONFIRM
    const [tempPin, setTempPin] = useState('');
    const [modalPin, setModalPin] = useState('');
    const [modalError, setModalError] = useState('');

    useEffect(() => {
        SecurityUtils.isBiometricsAvailable().then(setIsBiometricSupported);
    }, []);

    const handleToggleLock = (value) => {
        hapticFeedback.light();
        if (value) {
            // Enable: Start PIN setup
            setPinMode('SETUP');
            setPinStep('ENTER');
            setModalPin('');
            setTempPin('');
            setModalError('');
            setShowPinModal(true);
        } else {
            // Disable: Just turn off
            disableLock();
        }
    };

    const handleToggleBiometrics = async (value) => {
        hapticFeedback.light();
        if (value && !isBiometricSupported) {
            Alert.alert('Not Supported', 'Biometrics are not available on this device.');
            return;
        }
        updateSettings({ biometricsEnabled: value });
    };

    const handleChangePin = () => {
        hapticFeedback.light();
        setPinMode('CHANGE_VERIFY');
        setModalPin('');
        setModalError('');
        setShowPinModal(true);
    };

    const handlePinInput = (key) => {
        hapticFeedback.light();
        if (key === 'backspace') {
            setModalPin(prev => prev.slice(0, -1));
            setModalError('');
            return;
        }

        if (modalPin.length < 6) {
            const newPin = modalPin + key;
            setModalPin(newPin);
            setModalError('');

            // Auto submit logic
            if (newPin.length >= 4) {
                // Wait for user to stop or press enter? 
                // Simple approach: Use a "Done" button or just check at 4/6?
                // For setup, we need a consistent length. 
                // Let's enforce 4 digits for simplicity in this V1, or support 4-6 with a "OK" btn.
                // To match LockScreen which checks at 4 and 6... 
                // Let's just check dynamically.
            }
        }
    };

    const handleSubmitPin = async () => {
        if (modalPin.length < 4) {
            setModalError('PIN must be at least 4 digits');
            hapticFeedback.error();
            return;
        }

        if (pinMode === 'SETUP') {
            if (pinStep === 'ENTER') {
                setTempPin(modalPin);
                setPinStep('CONFIRM');
                setModalPin('');
            } else {
                // Confirm step
                if (modalPin === tempPin) {
                    // Success
                    await enableLock(modalPin, false); // Default bio false initially
                    setShowPinModal(false);
                    hapticFeedback.success();
                    Alert.alert('Success', 'App Lock enabled successfully.');
                } else {
                    setModalError('PINs do not match');
                    hapticFeedback.error();
                    setModalPin('');
                }
            }
        } else if (pinMode === 'CHANGE_VERIFY') {
            // Verify old pin
            const valid = await unlockApp(modalPin); // unlockApp verifies against stored hash
            if (valid) {
                setPinMode('CHANGE_NEW');
                setPinStep('ENTER');
                setModalPin('');
            } else {
                setModalError('Incorrect PIN');
                hapticFeedback.error();
                setModalPin('');
            }
        } else if (pinMode === 'CHANGE_NEW') {
            if (pinStep === 'ENTER') {
                setTempPin(modalPin);
                setPinStep('CONFIRM');
                setModalPin('');
            } else {
                if (modalPin === tempPin) {
                    await enableLock(modalPin, isBiometricsEnabled); // Keep bio setting
                    setShowPinModal(false);
                    hapticFeedback.success();
                    Alert.alert('Success', 'PIN changed successfully.');
                } else {
                    setModalError('PINs do not match');
                    hapticFeedback.error();
                    setModalPin('');
                }
            }
        }
    };

    // Helper to render keypad
    const renderKeypad = () => (
        <View style={localStyles.keypad}>
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                <TouchableOpacity
                    key={num}
                    style={[localStyles.key, { backgroundColor: isDark ? '#333' : '#eee' }]}
                    onPress={() => handlePinInput(num.toString())}
                >
                    <Text style={[localStyles.keyText, { color: colors.text }]}>{num}</Text>
                </TouchableOpacity>
            ))}
            <View style={localStyles.key} />
            <TouchableOpacity
                style={[localStyles.key, { backgroundColor: isDark ? '#333' : '#eee' }]}
                onPress={() => handlePinInput('0')}
            >
                <Text style={[localStyles.keyText, { color: colors.text }]}>0</Text>
            </TouchableOpacity>
            <TouchableOpacity
                style={[localStyles.key, { backgroundColor: 'transparent' }]}
                onPress={() => handlePinInput('backspace')}
            >
                <Ionicons name="backspace-outline" size={28} color={colors.text} />
            </TouchableOpacity>
        </View>
    );

    const styles = StyleSheet.create({
        container: {
            flex: 1,
            backgroundColor: colors.background,
        },
        section: {
            marginTop: 20,
            paddingHorizontal: 20,
        },
        item: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            paddingVertical: 15,
            borderBottomWidth: 1,
            borderBottomColor: colors.border,
        },
        itemText: {
            fontSize: 16,
            fontWeight: '500',
            color: colors.text,
        },
        button: {
            marginTop: 20,
            backgroundColor: colors.card,
            padding: 15,
            borderRadius: borderRadius.md,
            alignItems: 'center',
            borderWidth: 1,
            borderColor: colors.border,
        },
        buttonText: {
            color: colors.text,
            fontWeight: '600',
            fontSize: 16,
        },
        description: {
            fontSize: 13,
            color: colors.subText,
            marginTop: 5,
            lineHeight: 18,
        }
    });

    return (
        <View style={styles.container}>
            <View style={styles.section}>
                <View style={styles.item}>
                    <View style={{ flex: 1, paddingRight: 10 }}>
                        <Text style={styles.itemText}>Enable App Lock</Text>
                        <Text style={styles.description}>
                            Require a PIN to access the app
                        </Text>
                    </View>
                    <Switch
                        value={isAppLockEnabled}
                        onValueChange={handleToggleLock}
                        trackColor={{ false: '#767577', true: colors.primary }}
                        thumbColor={'#f4f3f4'}
                    />
                </View>

                {isAppLockEnabled && (
                    <>
                        <View style={styles.item}>
                            <View style={{ flex: 1, paddingRight: 10 }}>
                                <Text style={styles.itemText}>Biometric Unlock</Text>
                                <Text style={styles.description}>
                                    Use Fingerprint or FaceID to unlock
                                </Text>
                            </View>
                            <Switch
                                value={isBiometricsEnabled}
                                onValueChange={handleToggleBiometrics}
                                disabled={!isBiometricSupported}
                                trackColor={{ false: '#767577', true: colors.primary }}
                                thumbColor={!isBiometricSupported ? '#ccc' : '#f4f3f4'}
                            />
                        </View>

                        <TouchableOpacity style={styles.button} onPress={handleChangePin}>
                            <Text style={styles.buttonText}>Change PIN</Text>
                        </TouchableOpacity>
                    </>
                )}
            </View>

            {/* PIN MODAL */}
            <Modal visible={showPinModal} animationType="slide" transparent={false}>
                <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
                    <View style={{ padding: 20 }}>
                        <TouchableOpacity onPress={() => setShowPinModal(false)} style={{ alignSelf: 'flex-end', padding: 10 }}>
                            <Ionicons name="close" size={28} color={colors.text} />
                        </TouchableOpacity>

                        <Text style={{ fontSize: 22, fontWeight: 'bold', color: colors.text, textAlign: 'center', marginTop: 40 }}>
                            {pinMode === 'CHANGE_VERIFY' ? 'Enter Old PIN' :
                                pinStep === 'ENTER' ? (pinMode === 'CHANGE_NEW' ? 'Enter New PIN' : 'Create PIN') :
                                    'Confirm PIN'}
                        </Text>

                        {/* Dots */}
                        <View style={{ flexDirection: 'row', justifyContent: 'center', marginVertical: 40 }}>
                            {[0, 1, 2, 3].map(i => (
                                <View key={i} style={{
                                    width: 16, height: 16, borderRadius: 8, borderWidth: 1, borderColor: colors.text,
                                    marginHorizontal: 10,
                                    backgroundColor: i < modalPin.length ? colors.text : 'transparent'
                                }} />
                            ))}
                            {/* Simplified 4 dots for setup? Or dynamic */}
                        </View>

                        {modalError ? <Text style={{ color: colors.danger, textAlign: 'center', marginBottom: 20 }}>{modalError}</Text> : null}
                    </View>

                    <View style={{ flex: 1, justifyContent: 'flex-end', paddingBottom: 50 }}>
                        {renderKeypad()}
                        <TouchableOpacity
                            style={{ alignSelf: 'center', marginTop: 20, padding: 15, width: 120, alignItems: 'center', backgroundColor: colors.primary, borderRadius: 30 }}
                            onPress={handleSubmitPin}
                        >
                            <Text style={{ color: '#fff', fontWeight: 'bold' }}>
                                {pinMode === 'CHANGE_VERIFY' ? 'Next' : (pinStep === 'ENTER' ? 'Next' : 'Save')}
                            </Text>
                        </TouchableOpacity>
                    </View>
                </SafeAreaView>
            </Modal>
        </View>
    );
}

const localStyles = StyleSheet.create({
    keypad: {
        width: '100%',
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
    },
    keyText: {
        fontSize: 28,
        fontWeight: '600',
    }
});

export default AppLockScreen;

