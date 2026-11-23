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
