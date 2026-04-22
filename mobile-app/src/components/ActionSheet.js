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
                                        textColor = '#EF4444';
                                        iconBgColor = isDark ? '#7F1D1D' : '#FEE2E2';
                                    } else if (option.style === 'primary') {
                                        textColor = colors.primary;
                                        iconBgColor = isDark ? `${colors.primary}40` : `${colors.primary}20`;
                                    } else if (option.style === 'secondary') {
                                        textColor = colors.secondary;
                                        iconBgColor = isDark ? `${colors.secondary}40` : `${colors.secondary}20`;
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
                                        backgroundColor: isDark ? '#374151' : '#F3F4F6',
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
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'flex-end',
    },
    sheetContainer: {
        borderTopLeftRadius: 28,
        borderTopRightRadius: 28,
        paddingBottom: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
        elevation: 10,
    },
    handleBar: {
        alignItems: 'center',
        paddingVertical: 12,
    },
    handle: {
        width: 40,
        height: 4,
        borderRadius: 2,
    },
    headerSection: {
        paddingHorizontal: 20,
        paddingBottom: 16,
        borderBottomWidth: 1,
        marginBottom: 8,
    },
    title: {
        fontSize: 20,
        fontWeight: '800',
        marginBottom: 4,
    },
    subtitle: {
        fontSize: 14,
        lineHeight: 20,
    },
    optionsContainer: {
        paddingHorizontal: 12,
    },
    option: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 16,
        paddingHorizontal: 12,
        borderRadius: 12,
    },
    iconContainer: {
        width: 44,
        height: 44,
        borderRadius: 22,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 14,
    },
    optionIcon: {
        fontSize: 20,
    },
    optionTextContainer: {
        flex: 1,
    },
    optionText: {
        fontSize: 17,
        fontWeight: '600',
    },
    optionDescription: {
        fontSize: 13,
        marginTop: 2,
    },
    cancelButton: {
        marginHorizontal: 16,
        marginTop: 12,
        paddingVertical: 16,
        borderRadius: 14,
        alignItems: 'center',
        borderWidth: 1,
    },
    cancelText: {
        fontSize: 17,
        fontWeight: '700',
    },
});
