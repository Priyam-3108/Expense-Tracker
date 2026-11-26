# Accounts + Transfers — Phase 4C (Mobile) — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Mobile support for accounts + transfers: an account picker on Add Expense (works offline with a cached default), an `AccountsScreen` (list + balances, "last known" hint offline, add/edit/archive, statement, reconcile), a `TransferScreen`, an offline transfer queue + sync path, and navigation entries.

**Architecture:** `accountService` + `transferService` HTTP wrappers. `AccountContext` caches the last `GET /api/accounts` to AsyncStorage for offline display. A `local_transfers` SQLite table mirrors `local_expenses`; `offlineService` gains transfer methods; `syncEngine` runs transfer sync after expense sync. `account` is added to the local expense payload (defaulting to the cached default id).

**Tech Stack:** Expo ~54, RN 0.81, `expo-sqlite`, `@react-native-async-storage/async-storage`, `@react-native-community/netinfo`, `@expo/vector-icons`. No test runner — manual device smoke.

**Spec:** `docs/superpowers/specs/2026-09-10-accounts-transfers-design.md`

**Depends on:** Phase 4A merged. **Re-read against current code** — F1/F2/F3 mobile phases touched `AddExpenseScreen.js`, `syncEngine.js`, `db.js`, `DashboardScreen.js`, navigation.

## Global Constraints

- Account `type` icons (Ionicons): `cash`→`cash-outline`, `bank`→`business-outline`, `card`→`card-outline`, `savings`→`wallet-outline`, `other`→`ellipsis-horizontal`.
- Account picker on Add Expense shows non-archived accounts; default selection = cached default account id (`AsyncStorage 'default_account_id'`), falling back to the first account, falling back to unset (server fills it).
- `account` is part of the local expense payload — adding an expense offline still records the account.
- Transfers offline: queued in `local_transfers`, synced via `POST /api/transfers/sync`. `syncEngine` runs expense sync first, then transfer sync.
- `AccountsScreen` balances: live from `GET /api/accounts` when online; when offline, show the last cached list with a "balances may be out of date" line; if never cached, show `—`.
- Reconcile: a numeric prompt (use `CustomAlert` with a text input if the pattern exists, else a simple `Alert.prompt` on iOS / a tiny modal — match what the codebase already does; if nothing exists, a minimal inline modal).
- No new npm dependency.
- After each task: Metro bundles the changed screen(s) with no red-box on an emulator.
- Commit after each task with the message in its final step.

## File Structure

**Created**
- `mobile-app/src/services/accountService.js`, `mobile-app/src/services/transferService.js`
- `mobile-app/src/constants/accountTypes.js`
- `mobile-app/src/context/AccountContext.js`
- `mobile-app/src/screens/AccountsScreen.js`
- `mobile-app/src/screens/TransferScreen.js`

**Modified**
- `mobile-app/App.js` — mount `<AccountProvider>`
- `mobile-app/src/services/db.js` — `local_transfers` table
- `mobile-app/src/services/offlineService.js` — transfer queue methods; (expense payload already spreads `account`)
- `mobile-app/src/services/syncEngine.js` — transfer sync pass
- `mobile-app/src/screens/AddExpenseScreen.js` — account chip row + payload
- navigation file (`RootNavigator` / the relevant stack) — `Accounts` + `Transfer` routes

---

## Task 1: Services + constants

**Files:**
- Create: `mobile-app/src/services/accountService.js`, `mobile-app/src/services/transferService.js`, `mobile-app/src/constants/accountTypes.js`

**Interfaces:**
- `accountService`: `list(includeArchived?)`, `create(body)`, `update(id, body)`, `remove(id)`, `reconcile(id, targetBalance)`, `statement(id, params?)`.
- `transferService`: `list(params?)`, `create(body)`, `remove(id)`.
- `accountTypes.js`: `ACCOUNT_TYPES` `[{ value, label, icon }]` (icon = Ionicons name), `getAccountType(value)`.

- [ ] **Step 1: `accountService.js`**

```js
// mobile-app/src/services/accountService.js
import api from './api';

export const accountService = {
  list: (includeArchived = false) =>
    api.get('/accounts', { params: includeArchived ? { includeArchived: 'true' } : {} }),
  create: (body) => api.post('/accounts', body),
  update: (id, body) => api.put(`/accounts/${id}`, body),
  remove: (id) => api.delete(`/accounts/${id}`),
  reconcile: (id, targetBalance) => api.post(`/accounts/${id}/reconcile`, { targetBalance }),
  statement: (id, params = {}) => api.get(`/accounts/${id}/statement`, { params }),
};
```

- [ ] **Step 2: `transferService.js`**

```js
// mobile-app/src/services/transferService.js
import api from './api';

export const transferService = {
  list: (params = {}) => api.get('/transfers', { params }),
  create: (body) => api.post('/transfers', body),
  remove: (id) => api.delete(`/transfers/${id}`),
  sync: (transfers) => api.post('/transfers/sync', { transfers }),
};
```

- [ ] **Step 3: `accountTypes.js`**

```js
// mobile-app/src/constants/accountTypes.js
export const ACCOUNT_TYPES = [
  { value: 'cash', label: 'Cash', icon: 'cash-outline' },
  { value: 'bank', label: 'Bank', icon: 'business-outline' },
  { value: 'card', label: 'Card', icon: 'card-outline' },
  { value: 'savings', label: 'Savings', icon: 'wallet-outline' },
  { value: 'other', label: 'Other', icon: 'ellipsis-horizontal' },
];

export function getAccountType(value) {
  return ACCOUNT_TYPES.find((t) => t.value === value) || ACCOUNT_TYPES.find((t) => t.value === 'other');
}
```

- [ ] **Step 4: Commit**

```bash
git add mobile-app/src/services/accountService.js mobile-app/src/services/transferService.js mobile-app/src/constants/accountTypes.js
git commit -m "Add mobile account/transfer services + accountTypes constant

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

## Task 2: `AccountContext` (with offline cache)

**Files:**
- Create: `mobile-app/src/context/AccountContext.js`

**Interfaces:**
- Consumes: `accountService`; `AuthContext`; `AsyncStorage`; `NetInfo`.
- Produces: `AccountProvider`, `usePrivacy`-style `useAccounts()` → `{ accounts, defaultAccountId, totalBalance, stale, loading, loadAccounts, createAccount, updateAccount, deleteAccount, reconcile }`. On load: if online, fetch + cache to `AsyncStorage 'accounts_cache'` + store the default id to `'default_account_id'`; if offline, read the cache and set `stale = true`.

- [ ] **Step 1: Create the context**

```js
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
```

- [ ] **Step 2: Commit**

```bash
git add mobile-app/src/context/AccountContext.js
git commit -m "Add mobile AccountContext with offline cache

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

## Task 3: Mount provider + nav routes

**Files:**
- Modify: `mobile-app/App.js`
- Modify: the navigator file that declares the stack screens (find via `grep -rn "Stack.Screen\|createNativeStackNavigator\|createBottomTabNavigator" mobile-app/src mobile-app/App.js`)

**Interfaces:**
- Produces: `<AccountProvider>` wrapping `<RootNavigator />` (below `SecurityProvider`/`PrivacyProvider`); `Accounts` and `Transfer` screens registered in the appropriate stack.

- [ ] **Step 1: `App.js`**

```js
import { AccountProvider } from './src/context/AccountContext';
```

Wrap:

```jsx
          <SecurityProvider>
            <PrivacyProvider>{/* if present from F3 */}
              <AccountProvider>
                <RootNavigator />
              </AccountProvider>
            </PrivacyProvider>
          </SecurityProvider>
```

(If `PrivacyProvider` isn't merged yet, `<AccountProvider>` goes directly inside `<SecurityProvider>`.)

- [ ] **Step 2: Register the screens**

In the stack navigator that holds the main app screens (Dashboard, AddExpense, Analytics, Debt, Profile), add:

```jsx
<Stack.Screen name="Accounts" component={AccountsScreen} options={{ headerShown: false }} />
<Stack.Screen name="Transfer" component={TransferScreen} options={{ headerShown: false }} />
```

with the corresponding imports. Match the existing screen-registration style in that file.

- [ ] **Step 3: Add an entry point**

Add a way to reach `AccountsScreen` — e.g. a row in `ProfileScreen`'s settings list, or a card on the Dashboard. Simplest: a "Accounts" row in Profile's settings section navigating to `Accounts`. (A Dashboard balances card is nice-to-have — do it in Task 7 if time allows; the Profile row is the minimum.)

- [ ] **Step 4: Metro bundle check** — `npx expo start -c` → app boots; navigating to "Accounts" from Profile opens a screen (blank until Task 5).

- [ ] **Step 5: Commit**

```bash
git add mobile-app/App.js <navigator file> mobile-app/src/screens/ProfileScreen.js
git commit -m "Mount AccountProvider + register Accounts/Transfer screens

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

## Task 4: `local_transfers` table + offline transfer methods

**Files:**
- Modify: `mobile-app/src/services/db.js`
- Modify: `mobile-app/src/services/offlineService.js`

**Interfaces:**
- `db.js`: add `CREATE TABLE IF NOT EXISTS local_transfers (id INTEGER PRIMARY KEY AUTOINCREMENT, uuid TEXT UNIQUE NOT NULL, server_id TEXT, sync_status TEXT DEFAULT 'PENDING', payload TEXT NOT NULL, created_at TEXT DEFAULT CURRENT_TIMESTAMP)`.
- `offlineService.js`: `saveTransferLocally(data)` → inserts with a fresh uuid, returns `{ success, uuid, ...payload }`; `getPendingTransfers()` → rows with `sync_status IN ('PENDING','FAILED')`, parsed; `markTransferSynced(id, serverId)`; `markTransferFailed(id)`.

- [ ] **Step 1: `db.js`**

In the `initDB` body, after the `local_expenses` `CREATE TABLE`, add another `db.runAsync` with the `local_transfers` DDL above (same `try/catch` wrapper style).

- [ ] **Step 2: `offlineService.js`**

Add (mirroring `saveExpenseLocally` / `getPendingExpenses`):

```js
  async saveTransferLocally(data) {
    const db = await getDB();
    if (!db) return { success: false };
    const uuid = uuidv4();
    const payload = { ...data, client_uuid: uuid };
    try {
      await db.runAsync(
        'INSERT INTO local_transfers (uuid, sync_status, payload, created_at) VALUES (?, ?, ?, ?)',
        [uuid, 'PENDING', JSON.stringify(payload), new Date().toISOString()]
      );
      return { success: true, uuid, ...payload };
    } catch (error) {
      console.error('Error saving transfer locally:', error);
      throw error;
    }
  },

  async getPendingTransfers() {
    const db = await getDB();
    if (!db) return [];
    const rows = await db.getAllAsync(
      "SELECT * FROM local_transfers WHERE sync_status IN ('PENDING','FAILED')"
    );
    return rows.map((r) => ({ ...r, payload: JSON.parse(r.payload) }));
  },

  async markTransferSynced(id, serverId) {
    const db = await getDB();
    if (!db) return;
    await db.runAsync(
      "UPDATE local_transfers SET sync_status = 'SYNCED', server_id = ? WHERE id = ?",
      [serverId, id]
    );
  },

  async markTransferFailed(id) {
    const db = await getDB();
    if (!db) return;
    await db.runAsync("UPDATE local_transfers SET sync_status = 'FAILED' WHERE id = ?", [id]);
  },
```

(Match the exact `getAllAsync` / `runAsync` signatures the existing expense methods use in this file.)

- [ ] **Step 3: Metro bundle check** — app boots, no SQLite error in the logs (the `CREATE TABLE IF NOT EXISTS` is safe on existing installs).

- [ ] **Step 4: Commit**

```bash
git add mobile-app/src/services/db.js mobile-app/src/services/offlineService.js
git commit -m "Add local_transfers table + offline transfer queue methods

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

## Task 5: `AccountsScreen`

**Files:**
- Create: `mobile-app/src/screens/AccountsScreen.js`

**Interfaces:**
- Consumes: `useAccounts`, `useTheme`, `getAccountType`, `Ionicons`, `accountService` (statement), `Alert`, `useFocusEffect`.
- Produces: the screen — header with a back button + "Add" (opens a create modal/inline form), a list of account cards (name, type icon, balance, default badge), a `stale` banner when offline, per-card actions: Statement (navigate to a statement view or expand inline), Reconcile (numeric prompt → `reconcile`), Archive/Unarchive, Delete (403 → offer archive), plus a "New Transfer" button navigating to `TransferScreen`.

- [ ] **Step 1: Create the screen**

Model it on `DebtScreen.js` (list-of-cards, header, `useFocusEffect` refresh). Key pieces:

```jsx
// mobile-app/src/screens/AccountsScreen.js
import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, StatusBar, Alert, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useTheme } from '../context/ThemeContext';
import { useAccounts } from '../context/AccountContext';
import { getAccountType } from '../constants/accountTypes';
import { accountService } from '../services/accountService';

const fmt = (n, currency = 'INR') => {
  try {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency, minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(n || 0);
  } catch { return `${n}`; }
};

export default function AccountsScreen({ navigation }) {
  const { colors, isDark } = useTheme();
  const { accounts, totalBalance, stale, loading, loadAccounts, updateAccount, deleteAccount, reconcile, createAccount } = useAccounts();
  const [statementFor, setStatementFor] = useState(null);
  const [statement, setStatement] = useState([]);

  useFocusEffect(useCallback(() => { loadAccounts(); }, [loadAccounts]));

  const openStatement = async (acc) => {
    if (statementFor === acc._id) { setStatementFor(null); return; }
    setStatementFor(acc._id);
    try {
      const res = await accountService.statement(acc._id);
      setStatement(res.data?.data?.entries || []);
    } catch { setStatement([]); }
  };

  const onReconcile = (acc) => {
    // iOS has Alert.prompt; Android does not. Guard:
    if (Alert.prompt) {
      Alert.prompt('Reconcile', `Actual balance of "${acc.name}"`, async (val) => {
        const t = Number(val);
        if (Number.isNaN(t)) return Alert.alert('Invalid', 'Enter a number');
        try {
          const r = await reconcile(acc._id, t);
          Alert.alert('Done', r.adjusted ? `Adjusted by ${r.delta}` : 'Already balanced');
        } catch (e) { Alert.alert('Error', e.response?.data?.message || 'Reconcile failed'); }
      }, 'plain-text', String(acc.balance ?? 0));
    } else {
      // Android fallback: navigate to a tiny reconcile screen, or reuse a modal.
      // Minimum: Alert with instruction to use iOS / add a modal later.
      Alert.alert('Reconcile', 'Reconcile input is available on iOS in this build. A modal will be added for Android.');
    }
  };

  const onArchiveToggle = async (acc) => {
    try { await updateAccount(acc._id, { archived: !acc.archived }); }
    catch (e) { Alert.alert('Error', e.response?.data?.message || 'Failed'); }
  };

  const onDelete = (acc) => {
    Alert.alert('Delete account', `Delete "${acc.name}"?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        try { await deleteAccount(acc._id); }
        catch (e) {
          if (e.response?.status === 403) {
            Alert.alert(e.response.data.message, 'Archive it instead?', [
              { text: 'No', style: 'cancel' },
              { text: 'Archive', onPress: () => onArchiveToggle({ ...acc, archived: false }) },
            ]);
          } else {
            Alert.alert('Error', e.response?.data?.message || 'Delete failed');
          }
        }
      } },
    ]);
  };

  const onAdd = () => {
    Alert.prompt
      ? Alert.prompt('New account', 'Account name', async (name) => {
          if (!name?.trim()) return;
          try { await createAccount({ name: name.trim(), type: 'cash', openingBalance: 0 }); }
          catch (e) { Alert.alert('Error', e.response?.data?.message || 'Failed'); }
        })
      : Alert.alert('New account', 'Use the web app to add accounts, or a form will be added here.');
  };

  const s = makeStyles(colors);

  return (
    <View style={s.container}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={22} color={colors.text} />
        </TouchableOpacity>
        <Text style={s.title}>Accounts</Text>
        <TouchableOpacity onPress={onAdd}>
          <Ionicons name="add" size={24} color={colors.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16 }}>
        <Text style={s.total}>{fmt(totalBalance)}</Text>
        <Text style={s.totalLabel}>Total balance{stale ? ' · may be out of date' : ''}</Text>

        <TouchableOpacity style={s.transferBtn} onPress={() => navigation.navigate('Transfer')}>
          <Ionicons name="swap-horizontal" size={16} color="#fff" />
          <Text style={s.transferBtnText}>New Transfer</Text>
        </TouchableOpacity>

        {loading && accounts.length === 0 ? (
          <ActivityIndicator color={colors.primary} style={{ marginTop: 24 }} />
        ) : (
          accounts.map((acc) => {
            const type = getAccountType(acc.type);
            return (
              <View key={acc._id} style={s.card}>
                <View style={s.cardTop}>
                  <View style={s.cardLeft}>
                    <View style={s.iconWrap}><Ionicons name={type.icon} size={18} color={colors.primary} /></View>
                    <View>
                      <Text style={s.name}>{acc.name}{acc.isDefault ? '  ·  default' : ''}</Text>
                      <Text style={s.sub}>{acc.type} · {acc.currency}</Text>
                    </View>
                  </View>
                  <Text style={s.bal}>{stale ? '—' : fmt(acc.balance, acc.currency)}</Text>
                </View>
                <View style={s.actions}>
                  <TouchableOpacity onPress={() => openStatement(acc)}><Text style={s.action}>Statement</Text></TouchableOpacity>
                  <TouchableOpacity onPress={() => onReconcile(acc)}><Text style={s.action}>Reconcile</Text></TouchableOpacity>
                  {!acc.isDefault && <TouchableOpacity onPress={() => onArchiveToggle(acc)}><Text style={s.action}>{acc.archived ? 'Unarchive' : 'Archive'}</Text></TouchableOpacity>}
                  {!acc.isDefault && <TouchableOpacity onPress={() => onDelete(acc)}><Text style={[s.action, { color: colors.danger }]}>Delete</Text></TouchableOpacity>}
                </View>
                {statementFor === acc._id && (
                  <View style={s.statement}>
                    {statement.length === 0
                      ? <Text style={s.sub}>No activity.</Text>
                      : statement.map((e) => (
                          <View key={e._id} style={s.stRow}>
                            <Text style={s.stText} numberOfLines={1}>{e.description || e.counterparty || e.kind}</Text>
                            <Text style={s.stAmt}>{e.date} · {fmt(e.amount, acc.currency)}</Text>
                          </View>
                        ))}
                  </View>
                )}
              </View>
            );
          })
        )}
      </ScrollView>
    </View>
  );
}

function makeStyles(colors) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 50, paddingBottom: 12 },
    title: { fontSize: 20, fontWeight: '400', color: colors.text },
    total: { fontSize: 30, fontWeight: '300', color: colors.text },
    totalLabel: { fontSize: 12, color: colors.subText, marginBottom: 16 },
    transferBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: colors.primary, borderRadius: 14, paddingVertical: 12, marginBottom: 16 },
    transferBtnText: { color: '#fff', fontWeight: '500' },
    card: { backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1, borderRadius: 14, padding: 14, marginBottom: 10 },
    cardTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    cardLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    iconWrap: { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.primarySubdued || (colors.primary + '20'), justifyContent: 'center', alignItems: 'center' },
    name: { fontSize: 15, fontWeight: '400', color: colors.text },
    sub: { fontSize: 12, color: colors.subText, textTransform: 'capitalize' },
    bal: { fontSize: 16, fontWeight: '600', color: colors.text },
    actions: { flexDirection: 'row', flexWrap: 'wrap', gap: 14, marginTop: 12, paddingTop: 10, borderTopWidth: 1, borderTopColor: colors.border },
    action: { fontSize: 12, color: colors.subText },
    statement: { marginTop: 10, gap: 6 },
    stRow: { flexDirection: 'row', justifyContent: 'space-between' },
    stText: { fontSize: 12, color: colors.text, flex: 1, marginRight: 8 },
    stAmt: { fontSize: 12, color: colors.subText },
  });
}
```

- [ ] **Step 2: Emulator smoke** — Profile → Accounts → the default "Cash" account shows; add a "Bank" via the prompt; Statement expands; Reconcile (iOS); Archive/Delete rules hold; "New Transfer" navigates.

- [ ] **Step 3: Commit**

```bash
git add mobile-app/src/screens/AccountsScreen.js
git commit -m "Add AccountsScreen (balances, statement, reconcile, archive, delete)

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

## Task 6: `TransferScreen` (online + offline queue)

**Files:**
- Create: `mobile-app/src/screens/TransferScreen.js`

**Interfaces:**
- Consumes: `useAccounts`, `useTheme`, `NetInfo`, `transferService`, `offlineService.saveTransferLocally`, `syncEngine.syncNow`, `ModernDatePicker`, `Ionicons`.
- Produces: the screen — From/To account chip rows, amount input, date, note; submit: if online → `transferService.create`; if offline → `offlineService.saveTransferLocally` + a "queued" alert; guards for `from === to` / empty / amount ≤ 0; on server 400 (currency mismatch) show the message. On success, `navigation.goBack()` and (online) trigger `loadAccounts()`.

- [ ] **Step 1: Create the screen**

Model it on `AddDebtScreen.js` (hero-less, chip rows, sticky submit). Key logic:

```jsx
// mobile-app/src/screens/TransferScreen.js
import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet, StatusBar, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import NetInfo from '@react-native-community/netinfo';
import { useTheme } from '../context/ThemeContext';
import { useAccounts } from '../context/AccountContext';
import { transferService } from '../services/transferService';
import { offlineService } from '../services/offlineService';
import { syncEngine } from '../services/syncEngine';
import ModernDatePicker from '../components/ModernDatePicker';
import { getAccountType } from '../constants/accountTypes';

const fmtDate = (d) => {
  const y = d.getFullYear(), m = String(d.getMonth() + 1).padStart(2, '0'), day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

export default function TransferScreen({ navigation }) {
  const { colors, isDark } = useTheme();
  const { accounts, defaultAccountId, loadAccounts } = useAccounts();
  const [fromAccount, setFromAccount] = useState(defaultAccountId || '');
  const [toAccount, setToAccount] = useState('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(new Date());
  const [showDate, setShowDate] = useState(false);
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);

  const invalid = !fromAccount || !toAccount || fromAccount === toAccount || !(parseFloat(amount) > 0);

  const submit = async () => {
    if (invalid) {
      Alert.alert('Check the form', 'Pick two different accounts and a positive amount.');
      return;
    }
    setSaving(true);
    const body = { fromAccount, toAccount, amount: parseFloat(amount), date: fmtDate(date), note: note.trim() || undefined };
    try {
      const net = await NetInfo.fetch();
      if (net.isConnected) {
        await transferService.create(body);
        await loadAccounts();
      } else {
        await offlineService.saveTransferLocally(body);
        Alert.alert('Queued', 'Transfer saved offline and will sync when you reconnect.');
      }
      navigation.goBack();
    } catch (e) {
      Alert.alert('Error', e.response?.data?.message || 'Could not create transfer');
    } finally {
      setSaving(false);
    }
  };

  const s = makeStyles(colors);
  const Chip = ({ list, value, onPick }) => (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
      {list.map((a) => {
        const active = a._id === value;
        const t = getAccountType(a.type);
        return (
          <TouchableOpacity
            key={a._id}
            onPress={() => onPick(a._id)}
            style={[s.chip, { backgroundColor: active ? colors.primary + '20' : colors.card, borderColor: active ? colors.primary : colors.border }]}
          >
            <Ionicons name={t.icon} size={13} color={active ? colors.primary : colors.subText} />
            <Text style={[s.chipText, { color: active ? colors.primary : colors.text }]}>{a.name}</Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );

  return (
    <KeyboardAvoidingView style={s.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}><Ionicons name="arrow-back" size={22} color={colors.text} /></TouchableOpacity>
        <Text style={s.title}>New Transfer</Text>
        <View style={{ width: 22 }} />
      </View>

      <ScrollView contentContainerStyle={{ padding: 16 }}>
        <Text style={s.label}>From</Text>
        <Chip list={accounts} value={fromAccount} onPick={setFromAccount} />
        <Text style={s.label}>To</Text>
        <Chip list={accounts} value={toAccount} onPick={setToAccount} />
        {fromAccount && toAccount && fromAccount === toAccount && (
          <Text style={s.err}>Choose two different accounts.</Text>
        )}

        <Text style={s.label}>Amount</Text>
        <View style={s.inputCard}>
          <TextInput style={s.input} value={amount} onChangeText={setAmount} keyboardType="numeric" placeholder="0" placeholderTextColor={colors.subText} />
        </View>

        <Text style={s.label}>Date</Text>
        <TouchableOpacity style={s.inputCard} onPress={() => setShowDate(true)}>
          <Text style={s.input}>{date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</Text>
        </TouchableOpacity>
        <ModernDatePicker visible={showDate} selectedDate={date} onDateSelect={setDate} onClose={() => setShowDate(false)} />

        <Text style={s.label}>Note (optional)</Text>
        <View style={s.inputCard}>
          <TextInput style={s.input} value={note} onChangeText={setNote} placeholder="e.g. rent money" placeholderTextColor={colors.subText} maxLength={300} />
        </View>
      </ScrollView>

      <View style={s.footer}>
        <TouchableOpacity style={[s.submit, { opacity: saving ? 0.7 : 1 }]} disabled={saving} onPress={submit}>
          <Text style={s.submitText}>{saving ? 'Saving…' : 'Create Transfer'}</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

function makeStyles(colors) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 50, paddingBottom: 12 },
    title: { fontSize: 20, fontWeight: '400', color: colors.text },
    label: { fontSize: 11, fontWeight: '600', color: colors.subText, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 8, marginTop: 8 },
    chip: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 14, paddingVertical: 9, borderRadius: 9999, borderWidth: 1.5, marginRight: 8 },
    chipText: { fontSize: 13 },
    err: { color: colors.danger, fontSize: 12, marginBottom: 8 },
    inputCard: { backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1, borderRadius: 14, marginBottom: 4 },
    input: { padding: 16, fontSize: 15, fontWeight: '300', color: colors.text },
    footer: { padding: 16, borderTopWidth: 1, borderTopColor: colors.border, backgroundColor: colors.background },
    submit: { backgroundColor: colors.primary, borderRadius: 16, paddingVertical: 16, alignItems: 'center' },
    submitText: { color: '#fff', fontSize: 16, fontWeight: '500' },
  });
}
```

- [ ] **Step 2: Emulator smoke** — from Accounts → New Transfer → pick From/To, amount, submit online → transfer created, balances updated. Same-account → guard. Airplane mode → "Queued" alert; go online → syncs (Task 7).

- [ ] **Step 3: Commit**

```bash
git add mobile-app/src/screens/TransferScreen.js
git commit -m "Add TransferScreen (online create + offline queue)

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

## Task 7: `syncEngine` transfer pass + account on expense payload

**Files:**
- Modify: `mobile-app/src/services/syncEngine.js`
- Modify: `mobile-app/src/screens/AddExpenseScreen.js`

**Interfaces:**
- `syncEngine.syncNow` — after the expense sync block, run a transfer sync: `getPendingTransfers()` → if any + online → `transferService.sync(payloads)` → mark each `SYNCED`/`FAILED` from results.
- `AddExpenseScreen` — an account chip row (from `useAccounts().accounts`), default = `useAccounts().defaultAccountId`; `account` added to the `payload` in `handleSubmit`.

- [ ] **Step 1: `syncEngine.js` transfer pass**

Add imports:

```js
import { transferService } from './transferService';
```

At the end of `syncNow` (after expense results are processed), add:

```js
    // --- Transfers ---
    try {
      const pendingT = await offlineService.getPendingTransfers();
      if (pendingT.length > 0) {
        const payloads = pendingT.map((p) => ({ ...p.payload, client_uuid: p.uuid }));
        const res = await transferService.sync(payloads);
        if (res.data?.success && res.data.results) {
          for (const result of res.data.results) {
            const local = pendingT.find((p) => p.uuid === result.client_uuid);
            if (!local) continue;
            if (result.status === 'SYNCED') await offlineService.markTransferSynced(local.id, result.server_id);
            else await offlineService.markTransferFailed(local.id);
          }
        }
      }
    } catch (e) {
      console.error('Transfer sync failed:', e);
    }
```

(If `syncNow` early-returns when there are no pending *expenses*, restructure so the transfer pass still runs — e.g. compute both pending lists up front and skip the whole function only when both are empty.)

- [ ] **Step 2: `AddExpenseScreen.js` account chips**

Add `import { useAccounts } from '../context/AccountContext';`. In the component: `const { accounts, defaultAccountId } = useAccounts();` and `const [account, setAccount] = useState('');`. In the edit-prefill effect: `setAccount(exp.account?._id || exp.account || '');`. When not editing, seed the default once it's known:

```js
  useEffect(() => {
    if (!account && defaultAccountId && !route.params?.expense) setAccount(defaultAccountId);
  }, [account, defaultAccountId, route.params]);
```

In `resetForm`: `setAccount(defaultAccountId || '');`.

In `handleSubmit`'s `payload`, add `account` (or `account || undefined`):

```js
      const payload = {
        ...(isEditing && editId && { _id: editId, id: editId }),
        description, amount: parseFloat(amount), type, category, account,
        // ... paymentMode etc from F1 if merged ...
        date: fmt(date), isRecurring,
        ...(isRecurring && { recurringPeriod, recurringEndDate: fmt(recurringEndDate) }),
      };
```

Render an account chip row (after the category chips, matching that visual):

```jsx
                <Text style={s.sectionLabel}>Account</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.chipsScroll} style={{ marginBottom: 16 }}>
                  {accounts.map((a) => {
                    const isSel = account === a._id;
                    return (
                      <TouchableOpacity
                        key={a._id}
                        style={[s.chip, { backgroundColor: isSel ? colors.primary + '20' : colors.card, borderColor: isSel ? colors.primary : colors.border }]}
                        onPress={() => { hapticFeedback.light(); setAccount(a._id); }}
                      >
                        <Text style={[s.chipText, { color: isSel ? colors.primary : colors.text }]}>{a.name}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
```

- [ ] **Step 3: Emulator smoke**
- Add Expense online with a non-default account → server row has that `account`.
- Add Expense offline (airplane) → queued with the account in its payload → go online → `syncEngine` syncs it with the account.
- Create a transfer offline → queued → go online → `syncEngine` transfer pass creates it on the server (check `GET /api/transfers` or the web Transfers tab).
- `AccountsScreen` balances reflect the synced expense + transfer.

- [ ] **Step 4: Commit**

```bash
git add mobile-app/src/services/syncEngine.js mobile-app/src/screens/AddExpenseScreen.js
git commit -m "Sync offline transfers; add account chip row to AddExpenseScreen

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

## Task 8: Full manual device sweep

**Files:** none (verification task)

- [ ] **Step 1: Clean bundle** — `npx expo start -c`, no red-box on Dashboard, Add Expense, Analytics, Debt, Profile, Accounts, Transfer.

- [ ] **Step 2: Grep** — `cd mobile-app && grep -rn "accountService\|transferService\|useAccounts\|local_transfers\|AccountsScreen\|TransferScreen" src/ App.js`
Expected: only the files this plan created/modified.

- [ ] **Step 3: Sweep**
- New user (mobile register) → `AccountsScreen` shows the seeded "Cash" default.
- Add "Bank" (opening 1000). Add an expense of 200 on Bank → Bank balance 800.
- New transfer Bank→Cash 300 → Bank 500, Cash +300.
- Reconcile Bank to 600 (iOS) → statement shows an income adjustment; balance 600. (Android: the guard message appears — acceptable for v1.)
- Offline: add an expense (on Bank) + a transfer (Cash→Bank) in airplane mode → both queue → disable airplane → both sync (verify on the web app).
- Offline `AccountsScreen` → shows cached balances with the "may be out of date" line; `—` if never cached.
- Archive Bank → hidden from the Add Expense / Transfer pickers. Default "Cash" cannot be archived/deleted.
- Dark + light.

- [ ] **Step 4: Record the sweep in the task report.** Fixes belong in the owning file's task. Note any deferred bits (Android reconcile input, Dashboard balances card) explicitly.

---

## Self-Review

**1. Spec coverage**

| Spec item | Task |
|---|---|
| `accountService` / `transferService` (+ `transferService.sync`) | Task 1 |
| `AccountContext` with AsyncStorage offline cache + `stale` | Task 2 |
| Provider mount + `Accounts`/`Transfer` routes + Profile entry point | Task 3 |
| `local_transfers` table + offline transfer queue methods | Task 4 |
| `AccountsScreen` (balances, "last known" offline, statement, reconcile, archive, guarded delete + archive offer) | Task 5 |
| `TransferScreen` (online create + offline queue, from/to guard, currency-mismatch message) | Task 6 |
| `syncEngine` transfer pass (after expense sync) | Task 7 Step 1 |
| `account` on the local expense payload + default from context | Task 7 Step 2 |
| Manual device verification (no runner) | every smoke step + Task 8 |
| Offline balance = last known, `—` if never cached | Task 2 + Task 5 (`stale`, `—`) |
| No local balance recompute | (not implemented — cache only) |

**2. Placeholder scan:** No "TBD". Task 5/6 note the Android `Alert.prompt` gap explicitly with a v1 fallback and a "modal later" marker. Task 3 tells the implementer to `grep` for the navigator file rather than guessing its path. Task 7 Step 1 flags the "syncNow early-returns" case with the restructure instruction.

**3. Type consistency:**
- `accountService` / `transferService` method names identical Task 1 def ↔ Tasks 2, 5, 6, 7 consumers.
- `useAccounts()` → `{ accounts, defaultAccountId, totalBalance, stale, loading, loadAccounts, createAccount, updateAccount, deleteAccount, reconcile }` — Task 2 def; Tasks 5, 6, 7 use exactly these.
- `local_transfers` columns (`uuid`, `server_id`, `sync_status`, `payload`) mirror `local_expenses`; `offlineService` transfer methods (`saveTransferLocally`, `getPendingTransfers`, `markTransferSynced`, `markTransferFailed`) — Task 4 def; Task 6 (`saveTransferLocally`) + Task 7 (`getPendingTransfers`/`markTransfer*`) consumers.
- `transferService.sync(payloads)` → `res.data.results` `[{ client_uuid, server_id, status }]` — mirrors `syncExpenses`; 4A `syncTransfers` + Task 7 processing.
- Account shape `{ _id, name, type, currency, isDefault, archived, balance }` — 4A `listAccounts` + Task 5 render.
- `reconcile(id, target)` → `{ adjusted, delta }` — 4A + Task 2 + Task 5 (`r.adjusted`, `r.delta`).

---

## Execution Handoff

**Plan complete and saved to `docs/superpowers/plans/2026-09-10-accounts-transfers-4c-mobile.md`. Two execution options:**

**1. Subagent-Driven (recommended)** — fresh subagent per task, review between tasks.
**2. Inline Execution** — `superpowers:executing-plans`, batch with checkpoints.

**Which approach?**
