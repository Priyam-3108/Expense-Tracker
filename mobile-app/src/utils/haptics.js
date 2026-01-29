import * as Haptics from 'expo-haptics';

/**
 * Haptic feedback utilities for enhanced user experience
 */

export const hapticFeedback = {
    // Light impact - for subtle interactions like button taps
    light: () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    },

    // Medium impact - for standard interactions
    medium: () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    },

    // Heavy impact - for important actions
    heavy: () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    },

    // Success feedback - for successful operations
    success: () => {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    },

    // Warning feedback - for warnings
    warning: () => {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    },

    // Error feedback - for errors
    error: () => {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    },

    // Selection feedback - for picker/selector changes
    selection: () => {
        Haptics.selectionAsync();
    },
};

export default hapticFeedback;
