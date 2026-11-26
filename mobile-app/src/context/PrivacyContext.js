import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AuthContext } from './AuthContext';

const PrivacyContext = createContext({ isPrivate: false, setPrivate: () => {}, toggle: () => {} });

const KEY = 'privacyMode';

export const PrivacyProvider = ({ children }) => {
  const { user } = useContext(AuthContext);
  const [isPrivate, setIsPrivate] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const [adoptedDefault, setAdoptedDefault] = useState(false);

  // Hydrate from storage once.
  useEffect(() => {
    (async () => {
      try {
        const v = await AsyncStorage.getItem(KEY);
        if (v === '1') { setIsPrivate(true); setAdoptedDefault(true); }
        else if (v === '0') { setIsPrivate(false); setAdoptedDefault(true); }
      } catch {
        /* ignore */
      } finally {
        setHydrated(true);
      }
    })();
  }, []);

  // Adopt the server default once, only if no stored per-device choice.
  useEffect(() => {
    if (!hydrated || adoptedDefault) return;
    if (user && typeof user.privacyModeDefault === 'boolean') {
      setIsPrivate(user.privacyModeDefault);
      setAdoptedDefault(true);
    }
  }, [hydrated, adoptedDefault, user]);

  const persist = useCallback(async (val) => {
    try { await AsyncStorage.setItem(KEY, val ? '1' : '0'); } catch { /* ignore */ }
  }, []);

  const setPrivate = useCallback((val) => {
    setIsPrivate(!!val);
    setAdoptedDefault(true);
    persist(!!val);
  }, [persist]);

  const toggle = useCallback(() => {
    setIsPrivate((prev) => {
      const next = !prev;
      persist(next);
      return next;
    });
    setAdoptedDefault(true);
  }, [persist]);

  return (
    <PrivacyContext.Provider value={{ isPrivate, setPrivate, toggle }}>
      {children}
    </PrivacyContext.Provider>
  );
};

export function usePrivacy() {
  return useContext(PrivacyContext);
}
