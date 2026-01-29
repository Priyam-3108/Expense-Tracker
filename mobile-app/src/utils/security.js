import * as SecureStore from 'expo-secure-store';
import * as Crypto from 'expo-crypto';
import * as LocalAuthentication from 'expo-local-authentication';

const SETTINGS_KEY = 'app_lock_settings';

export const SecurityUtils = {
    /**
     * Hash a PIN code using SHA-256
     * @param {string} pin - 4 or 6 digit PIN
     * @returns {Promise<string>} - Hashed PIN
     */
    hashPIN: async (pin) => {
        const digest = await Crypto.digestStringAsync(
            Crypto.CryptoDigestAlgorithm.SHA256,
            pin
        );
        return digest;
    },

    /**
     * Helper to sanitize keys for SecureStore
     * @param {string|number} key 
     * @returns {string}
     */
    _sanitizeKey: (key) => {
        return String(key).replace(/[^a-zA-Z0-9.\-_]/g, '_');
    },

    /**
     * Save lock settings properly securely
     * @param {Object} settings - { isEnabled, biometricsEnabled, pinHash }
     * @param {string} [userId] - Optional user ID to namespace settings
     */
    saveSettings: async (settings, userId = 'global') => {
        try {
            const sanitizedId = SecurityUtils._sanitizeKey(userId);
            await SecureStore.setItemAsync(
                `${SETTINGS_KEY}_${sanitizedId}`,
                JSON.stringify(settings)
            );
            return true;
        } catch (error) {
            console.error('Error saving lock settings:', error);
            return false;
        }
    },

    /**
     * Get lock settings
     * @returns {Promise<Object|null>}
     */
    getSettings: async (userId = 'global') => {
        try {
            const sanitizedId = SecurityUtils._sanitizeKey(userId);
            const result = await SecureStore.getItemAsync(`${SETTINGS_KEY}_${sanitizedId}`);
            return result ? JSON.parse(result) : null;
        } catch (error) {
            console.error('Error getting lock settings:', error);
            return null;
        }
    },

    /**
     * Clear lock settings (e.g. on logout or disable)
     */
    clearSettings: async (userId = 'global') => {
        try {
            const sanitizedId = SecurityUtils._sanitizeKey(userId);
            await SecureStore.deleteItemAsync(`${SETTINGS_KEY}_${sanitizedId}`);
            return true;
        } catch (error) {
            console.error('Error clearing lock settings:', error);
            return false;
        }
    },

    /**
     * Check if hardware supports biometrics
     * @returns {Promise<boolean>}
     */
    isBiometricsAvailable: async () => {
        const hasHardware = await LocalAuthentication.hasHardwareAsync();
        const isEnrolled = await LocalAuthentication.isEnrolledAsync();
        return hasHardware && isEnrolled;
    },

    /**
     * Authenticate with biometrics
     * @returns {Promise<boolean>} - True if success
     */
    authenticateBiometric: async () => {
        try {
            const hasHardware = await LocalAuthentication.hasHardwareAsync();
            if (!hasHardware) return false;

            const result = await LocalAuthentication.authenticateAsync({
                promptMessage: 'Unlock App',
                fallbackLabel: 'Use PIN',
                cancelLabel: 'Cancel',
                disableDeviceFallback: true, // We want to force our own PIN fallback if bio fails
            });

            return result.success;
        } catch (error) {
            console.error('Biometric auth error:', error);
            return false;
        }
    }
};
