// mobile-app/src/context/AccountContext.js
import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import { AuthContext } from './AuthContext';
import { accountService } from '../services/accountService';

const AccountContext = createContext(null);
const CACHE_KEY = 'accounts_cache';
const DEFAULT_KEY = 'default_account_id';

export const AccountProvider = ({ children }) => {
  const { user } = useContext(AuthContext);
  const [accounts, setAccounts] = useState([]);
  const [totalBalance, setTotalBalance] = useState(0);
  const [stale, setStale] = useState(false);
  const [loading, setLoading] = useState(false);

  const loadAccounts = useCallback(async () => {
    setLoading(true);
    try {
      const net = await NetInfo.fetch();
      if (net.isConnected) {
        const res = await accountService.list(false);
        const list = res.data?.data?.accounts || [];
        setAccounts(list);
        setTotalBalance(res.data?.data?.totalBalance ?? 0);
        setStale(false);
        await AsyncStorage.setItem(CACHE_KEY, JSON.stringify({ accounts: list, totalBalance: res.data?.data?.totalBalance ?? 0 }));
        const def = list.find((a) => a.isDefault) || list[0];
        if (def) await AsyncStorage.setItem(DEFAULT_KEY, String(def._id));
        return list;
      }
      // offline: use cache
      const raw = await AsyncStorage.getItem(CACHE_KEY);
      if (raw) {
        const cached = JSON.parse(raw);
        setAccounts(cached.accounts || []);
        setTotalBalance(cached.totalBalance || 0);
        setStale(true);
      }
      return [];
    } catch (e) {
      const raw = await AsyncStorage.getItem(CACHE_KEY);
      if (raw) {
        const cached = JSON.parse(raw);
        setAccounts(cached.accounts || []);
        setTotalBalance(cached.totalBalance || 0);
        setStale(true);
      }
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user) loadAccounts();
  }, [user, loadAccounts]);

  const createAccount = useCallback(async (body) => {
    const res = await accountService.create(body);
    await loadAccounts();
    return res.data?.data?.account;
  }, [loadAccounts]);

  const updateAccount = useCallback(async (id, body) => {
    const res = await accountService.update(id, body);
    await loadAccounts();
    return res.data?.data?.account;
  }, [loadAccounts]);

  const deleteAccount = useCallback(async (id) => {
    await accountService.remove(id);
    await loadAccounts();
  }, [loadAccounts]);

  const reconcile = useCallback(async (id, target) => {
    const res = await accountService.reconcile(id, target);
    await loadAccounts();
    return res.data?.data;
  }, [loadAccounts]);

  const visible = accounts.filter((a) => !a.archived);
  const defaultAccountId = visible.find((a) => a.isDefault)?._id || visible[0]?._id || null;

  return (
    <AccountContext.Provider
      value={{ accounts: visible, defaultAccountId, totalBalance, stale, loading, loadAccounts, createAccount, updateAccount, deleteAccount, reconcile }}
    >
      {children}
    </AccountContext.Provider>
  );
};

export function useAccounts() {
  const ctx = useContext(AccountContext);
  if (!ctx) throw new Error('useAccounts must be used within AccountProvider');
  return ctx;
}
