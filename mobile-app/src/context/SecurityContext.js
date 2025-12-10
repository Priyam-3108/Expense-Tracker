import React, { createContext, useState, useEffect, useContext, useRef } from 'react';
import { AppState } from 'react-native';
import { SecurityUtils } from '../utils/security';
import { AuthContext } from './AuthContext';

export const SecurityContext = createContext();

export const SecurityProvider = ({ children }) => {
    const { user } = useContext(AuthContext);
    const [isLocked, setIsLocked] = useState(false);
    const [isAppLockEnabled, setIsAppLockEnabled] = useState(false);
    const [isBiometricsEnabled, setIsBiometricsEnabled] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    // We can use the user's ID to scope settings if available, otherwise 'global'
    const userId = user?.id || user?.email || 'global';

    const appState = useRef(AppState.currentState);

    // Load settings on mount or user change
    useEffect(() => {
        loadSettings();
    }, [userId]);

    const loadSettings = async () => {
        try {
            const settings = await SecurityUtils.getSettings(userId);
            if (settings && settings.isEnabled) {
                setIsAppLockEnabled(true);
                setIsBiometricsEnabled(settings.biometricsEnabled || false);
                // If loaded and enabled, start locked? 
                // Usually dependent on if coming from cold start.
                // For safety, let's lock on cold start if enabled.
                setIsLocked(true);
            } else {
                setIsAppLockEnabled(false);
                setIsBiometricsEnabled(false);
                setIsLocked(false);
            }
        } catch (e) {
            console.error('Error loading security settings', e);
        } finally {
            setIsLoading(false);
        }
    };

    // Listen to App State changes
    useEffect(() => {
        const subscription = AppState.addEventListener('change', nextAppState => {
            if (
                appState.current.match(/inactive|background/) &&
                nextAppState === 'active'
            ) {
                // App returning to foreground
                // Do nothing specific, wait for user input on lock screen if already locked
            } else if (nextAppState === 'background' || nextAppState === 'inactive') {
                // App going to background
                if (isAppLockEnabled) {
                    setIsLocked(true);
                }
            }

            appState.current = nextAppState;
        });

        return () => {
            subscription.remove();
        };
    }, [isAppLockEnabled]);

    const unlockApp = async (pin) => {
        // Authenticate PIN
        const settings = await SecurityUtils.getSettings(userId);
        if (!settings) return false;

        const hashedPin = await SecurityUtils.hashPIN(pin);
        if (hashedPin === settings.pinHash) {
            setIsLocked(false);
            return true;
        }
        return false;
    };

    const unlockWithBiometrics = async () => {
        if (!isBiometricsEnabled) return false;

        const success = await SecurityUtils.authenticateBiometric();
        if (success) {
            setIsLocked(false);
            return true;
        }
        return false;
    };

    const enableLock = async (pin, enableBiometrics = false) => {
        const hashedPin = await SecurityUtils.hashPIN(pin);
        const settings = {
            isEnabled: true,
            biometricsEnabled: enableBiometrics,
            pinHash: hashedPin
        };

        const success = await SecurityUtils.saveSettings(settings, userId);
        if (success) {
            setIsAppLockEnabled(true);
            setIsBiometricsEnabled(enableBiometrics);
            return true;
        }
        return false;
    };

    const disableLock = async () => {
        const success = await SecurityUtils.clearSettings(userId);
        if (success) {
            setIsAppLockEnabled(false);
            setIsBiometricsEnabled(false);
            setIsLocked(false);
            return true;
        }
        return false;
    };

    const updateSettings = async (settings) => {
        // Must merge with existing settings
        const current = await SecurityUtils.getSettings(userId);
        if (!current) return false;

        const newSettings = { ...current, ...settings };
        const success = await SecurityUtils.saveSettings(newSettings, userId);
        if (success) {
            if (settings.hasOwnProperty('isEnabled')) setIsAppLockEnabled(settings.isEnabled);
            if (settings.hasOwnProperty('biometricsEnabled')) setIsBiometricsEnabled(settings.biometricsEnabled);
            return true;
        }
        return false;
    };

    return (
        <SecurityContext.Provider value={{
            isLocked,
            isAppLockEnabled,
            isBiometricsEnabled,
            isLoading,
            unlockApp,
            unlockWithBiometrics,
            enableLock,
            disableLock,
            updateSettings,
            setIsLocked // Exposed for testing or manual lock
        }}>
            {children}
        </SecurityContext.Provider>
    );
};
