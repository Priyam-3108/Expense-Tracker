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
                return '✓';
            case 'warning':
                return '⚠';
            case 'danger':
                return '✕';
            default:
                return 'ℹ';
        }
    };

    const getColorForType = () => {
        switch (type) {
            case 'success':
                return '#10B981';
            case 'warning':
                return '#F59E0B';
            case 'danger':
                return '#EF4444';
            default:
                return colors.primary;
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
                            <View style={[styles.iconContainer, { backgroundColor: `${iconColor}15` }]}>
                                <Text style={[styles.icon, { color: iconColor }]}>
                                    {getIconForType()}
                                </Text>
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
                                        backgroundColor = '#EF4444';
                                        textColor = 'white';
                                    } else if (button.style === 'primary') {
                                        backgroundColor = colors.primary;
                                        textColor = 'white';
                                    } else if (button.style === 'cancel') {
                                        backgroundColor = isDark ? '#374151' : '#F3F4F6';
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
                                            activeOpacity={0.7}
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
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    alertContainer: {
        width: width - 60,
        maxWidth: 400,
        borderRadius: 24,
        padding: 24,
        alignItems: 'center',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.3,
        shadowRadius: 20,
        elevation: 10,
    },
    iconContainer: {
        width: 64,
        height: 64,
        borderRadius: 32,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
    },
    icon: {
        fontSize: 32,
        fontWeight: 'bold',
    },
    title: {
        fontSize: 20,
        fontWeight: '800',
        marginBottom: 8,
        textAlign: 'center',
    },
    message: {
        fontSize: 15,
        textAlign: 'center',
        marginBottom: 24,
        lineHeight: 22,
    },
    buttonContainer: {
        flexDirection: 'row',
        width: '100%',
        gap: 8,
    },
    button: {
        paddingVertical: 14,
        paddingHorizontal: 20,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        minWidth: 100,
    },
    buttonText: {
        fontSize: 16,
        fontWeight: '700',
    },
});
