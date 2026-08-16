import React, { useEffect, useRef } from 'react';
import {
    Modal,
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    Animated,
    Dimensions,
    TouchableWithoutFeedback,
} from 'react-native';
import { useTheme } from '../context/ThemeContext';

const { height } = Dimensions.get('window');

export default function ActionSheet({ visible, onClose, options = [], title, subtitle }) {
    const { colors, isDark } = useTheme();
    const slideAnim = useRef(new Animated.Value(height)).current;
    const fadeAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        if (visible) {
            Animated.parallel([
                Animated.spring(slideAnim, {
                    toValue: 0,
                    tension: 65,
                    friction: 9,
                    useNativeDriver: true,
                }),
                Animated.timing(fadeAnim, {
                    toValue: 1,
                    duration: 250,
                    useNativeDriver: true,
                }),
            ]).start();
        } else {
            Animated.parallel([
                Animated.timing(slideAnim, {
                    toValue: height,
                    duration: 200,
                    useNativeDriver: true,
                }),
                Animated.timing(fadeAnim, {
                    toValue: 0,
                    duration: 200,
                    useNativeDriver: true,
                }),
            ]).start();
        }
    }, [visible]);

    const getIconForType = (type) => {
        switch (type) {
            case 'edit':
                return '✏️';
            case 'delete':
                return '🗑️';
            case 'view':
                return '👁️';
            case 'share':
                return '📤';
            default:
                return '•';
        }
    };

    return (
        <Modal transparent visible={visible} animationType="none" onRequestClose={onClose}>
            <TouchableWithoutFeedback onPress={onClose}>
                <Animated.View style={[styles.overlay, { opacity: fadeAnim }]}>
                    <TouchableWithoutFeedback>
                        <Animated.View
                            style={[
                                styles.sheetContainer,
                                {
                                    backgroundColor: colors.card,
                                    transform: [{ translateY: slideAnim }],
                                },
                            ]}
                        >
                            {/* Handle Bar */}
                            <View style={styles.handleBar}>
                                <View style={[styles.handle, { backgroundColor: colors.border }]} />
                            </View>

                            {/* Title Section */}
                            {(title || subtitle) && (
                                <View style={[styles.headerSection, { borderBottomColor: colors.border }]}>
                                    {title && (
                                        <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
                                    )}
                                    {subtitle && (
                                        <Text style={[styles.subtitle, { color: colors.subText }]}>
                                            {subtitle}
                                        </Text>
                                    )}
                                </View>
                            )}

                            {/* Options */}
                            <View style={styles.optionsContainer}>
                                {options.map((option, index) => {
                                    let textColor = colors.text;
                                    let bgColor = 'transparent';
                                    let iconBgColor = `${colors.border}80`;

                                    if (option.style === 'destructive') {
                                        textColor = colors.danger || '#ea2261';
                                        iconBgColor = isDark ? '#3d1624' : '#fce4ec';
                                    } else if (option.style === 'primary') {
                                        textColor = colors.primary || '#533afd';
                                        iconBgColor = isDark ? '#1f1e4d' : '#eef0fe';
                                    } else if (option.style === 'secondary') {
                                        textColor = colors.text;
                                        iconBgColor = isDark ? `${colors.border}80` : '#f6f9fc';
                                    }

                                    return (
                                        <TouchableOpacity
                                            key={index}
                                            style={[
                                                styles.option,
                                                {
                                                    backgroundColor: bgColor,
                                                    borderBottomWidth: index < options.length - 1 ? 1 : 0,
                                                    borderBottomColor: colors.border,
                                                },
                                            ]}
                                            onPress={() => {
                                                option.onPress && option.onPress();
                                                onClose && onClose();
                                            }}
                                            activeOpacity={0.6}
                                        >
                                            {option.icon && (
                                                <View
                                                    style={[
                                                        styles.iconContainer,
                                                        {
                                                            backgroundColor: iconBgColor,
                                                        },
                                                    ]}
                                                >
                                                    <Text style={styles.optionIcon}>
                                                        {getIconForType(option.icon)}
                                                    </Text>
                                                </View>
                                            )}
                                            <View style={styles.optionTextContainer}>
                                                <Text style={[styles.optionText, { color: textColor }]}>
                                                    {option.text}
                                                </Text>
                                                {option.description && (
                                                    <Text style={[styles.optionDescription, { color: colors.subText }]}>
                                                        {option.description}
                                                    </Text>
                                                )}
                                            </View>
                                        </TouchableOpacity>
                                    );
                                })}
                            </View>

                            {/* Cancel Button */}
                            <TouchableOpacity
                                style={[
                                    styles.cancelButton,
                                    {
                                        backgroundColor: isDark ? '#273951' : '#e3e8ee',
                                        borderColor: colors.border,
                                    },
                                ]}
                                onPress={onClose}
                                activeOpacity={0.7}
                            >
                                <Text style={[styles.cancelText, { color: colors.text }]}>Cancel</Text>
                            </TouchableOpacity>
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
        backgroundColor: 'rgba(13, 37, 61, 0.65)',
        justifyContent: 'flex-end',
    },
    sheetContainer: {
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        paddingBottom: 24,
        shadowColor: '#003770',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.15,
        shadowRadius: 16,
        elevation: 10,
    },
    handleBar: {
        alignItems: 'center',
        paddingVertical: 10,
    },
    handle: {
        width: 36,
        height: 4,
        borderRadius: 2,
    },
    headerSection: {
        paddingHorizontal: 20,
        paddingBottom: 14,
        borderBottomWidth: 1,
        marginBottom: 6,
    },
    title: {
        fontSize: 18,
        fontWeight: '300', // Sohne thin style
        letterSpacing: -0.22,
        marginBottom: 2,
    },
    subtitle: {
        fontSize: 13,
        fontWeight: '300',
        lineHeight: 18,
    },
    optionsContainer: {
        paddingHorizontal: 12,
    },
    option: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 14,
        paddingHorizontal: 12,
        borderRadius: 8,
    },
    iconContainer: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    optionIcon: {
        fontSize: 18,
    },
    optionTextContainer: {
        flex: 1,
    },
    optionText: {
        fontSize: 15,
        fontWeight: '400',
        letterSpacing: -0.2,
    },
    optionDescription: {
        fontSize: 12,
        marginTop: 1,
    },
    cancelButton: {
        marginHorizontal: 16,
        marginTop: 12,
        paddingVertical: 12,
        borderRadius: 9999, // Stripe pill button
        alignItems: 'center',
        borderWidth: 1,
    },
    cancelText: {
        fontSize: 15,
        fontWeight: '400',
    },
});
