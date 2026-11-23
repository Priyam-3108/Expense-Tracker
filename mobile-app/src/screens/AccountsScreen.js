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
