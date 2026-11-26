import React, { useEffect, useRef } from 'react';
import {
    Modal,
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    Animated,
    Dimensions,
    TouchableWithoutFeedback
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';

const { width } = Dimensions.get('window');

export default function CustomAlert({
    visible,
    title,
    message,
    buttons = [],
    onClose,
    type = 'default' // 'default', 'success', 'warning', 'danger'
}) {
    const { colors, isDark } = useTheme();
    const scaleAnim = useRef(new Animated.Value(0)).current;
    const fadeAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        if (visible) {
            Animated.parallel([
                Animated.spring(scaleAnim, {
                    toValue: 1,
                    tension: 50,
                    friction: 7,
                    useNativeDriver: true,
                }),
                Animated.timing(fadeAnim, {
                    toValue: 1,
                    duration: 200,
                    useNativeDriver: true,
                })
            ]).start();
        } else {
            Animated.parallel([
                Animated.timing(scaleAnim, {
                    toValue: 0,
                    duration: 150,
                    useNativeDriver: true,
                }),
                Animated.timing(fadeAnim, {
                    toValue: 0,
                    duration: 150,
                    useNativeDriver: true,
                })
            ]).start();
        }
    }, [visible]);

    const getIconForType = () => {
        switch (type) {
            case 'success':
                return 'checkmark';
            case 'warning':
                return 'alert';
            case 'danger':
                return 'trash-outline';
            default:
                return 'information';
        }
    };

    const getColorForType = () => {
        switch (type) {
            case 'success':
                return colors.success;
            case 'warning':
                return colors.warning;
            case 'danger':
                return colors.danger;
            default:
                return colors.textSecondary;
        }
    };

    const iconColor = getColorForType();

    return (
        <Modal
            transparent
            visible={visible}
            animationType="none"
            onRequestClose={onClose}
        >
            <TouchableWithoutFeedback onPress={onClose}>
                <Animated.View
                    style={[
                        styles.overlay,
                        { opacity: fadeAnim }
                    ]}
                >
                    <TouchableWithoutFeedback>
                        <Animated.View
                            style={[
                                styles.alertContainer,
                                {
                                    backgroundColor: colors.card,
                                    transform: [{ scale: scaleAnim }],
                                    shadowColor: isDark ? '#000' : '#000',
                                }
                            ]}
                        >
                            {/* Icon */}
                            <View style={[styles.iconContainer, { backgroundColor: colors.cardElevated }]}>
                                <Ionicons name={getIconForType()} size={22} color={iconColor} />
                            </View>

                            {/* Title */}
                            {title && (
                                <Text style={[styles.title, { color: colors.text }]}>
                                    {title}
                                </Text>
                            )}

                            {/* Message */}
                            {message && (
                                <Text style={[styles.message, { color: colors.subText }]}>
                                    {message}
                                </Text>
                            )}

                            {/* Buttons */}
                            <View style={styles.buttonContainer}>
                                {buttons.map((button, index) => {
                                    let buttonStyle = styles.button;
                                    let buttonTextStyle = styles.buttonText;
                                    let backgroundColor = colors.border;
                                    let textColor = colors.text;

                                    if (button.style === 'destructive') {
                                        backgroundColor = colors.danger || '#dc2626';
                                        textColor = 'white';
                                    } else if (button.style === 'primary') {
                                        backgroundColor = colors.primary || '#a8611c';
                                        textColor = 'white';
                                    } else if (button.style === 'cancel') {
                                        backgroundColor = isDark ? '#525252' : '#e5e5e5';
                                        textColor = colors.text;
                                    }

                                    return (
                                        <TouchableOpacity
                                            key={index}
                                            style={[
                                                buttonStyle,
                                                {
                                                    backgroundColor,
                                                    flex: buttons.length > 1 ? 1 : 0,
                                                    marginLeft: index > 0 ? 8 : 0,
                                                }
                                            ]}
                                            onPress={() => {
                                                button.onPress && button.onPress();
                                                onClose && onClose();
                                            }}
                                            activeOpacity={0.75}
                                        >
                                            <Text style={[buttonTextStyle, { color: textColor }]}>
                                                {button.text}
                                            </Text>
                                        </TouchableOpacity>
                                    );
                                })}
                            </View>
                        </Animated.View>
                    </TouchableWithoutFeedback>
                </Animated.View>
            </TouchableWithoutFeedback>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(10, 10, 10, 0.55)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    alertContainer: {
        width: width - 60,
        maxWidth: 400,
        borderRadius: 16,
        padding: 24,
        alignItems: 'center',
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.15,
        shadowRadius: 24,
        elevation: 10,
        borderWidth: 1,
        borderColor: 'rgba(227, 232, 238, 0.5)',
    },
    iconContainer: {
        width: 56,
        height: 56,
        borderRadius: 28,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
    },
    icon: {
        fontSize: 26,
        fontWeight: '500',
    },
    title: {
        fontSize: 18,
        fontWeight: '400',
        letterSpacing: -0.22,
        marginBottom: 6,
        textAlign: 'center',
    },
    message: {
        fontSize: 14,
        fontWeight: '400',
        textAlign: 'center',
        marginBottom: 20,
        lineHeight: 20,
    },
    buttonContainer: {
        flexDirection: 'row',
        width: '100%',
        justifyContent: 'center',
        gap: 8,
    },
    button: {
        paddingVertical: 10,
        paddingHorizontal: 16,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
        minWidth: 90,
    },
    buttonText: {
        fontSize: 14,
        fontWeight: '400',
        letterSpacing: 0,
    },
});
