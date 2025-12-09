import React, { useEffect, useState, useContext, useCallback } from 'react';
import { View, Text, SectionList, TouchableOpacity, StyleSheet, ActivityIndicator, RefreshControl, StatusBar } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { AuthContext } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { expenseService } from '../services/expenseService';
import CustomAlert from '../components/CustomAlert';
import ActionSheet from '../components/ActionSheet';

export default function DashboardScreen({ navigation }) {
  const { signOut, user } = useContext(AuthContext);
  const { theme, toggleTheme, isDark, colors } = useTheme();
  const [sections, setSections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [summary, setSummary] = useState({ income: 0, expense: 0, balance: 0 });

  // Action Sheet & Alert States
  const [showActionSheet, setShowActionSheet] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState(null);
  const [showDeleteAlert, setShowDeleteAlert] = useState(false);
  const [deleteExpenseId, setDeleteExpenseId] = useState(null);

  const currencySymbols = {
    'USD': '$', 'EUR': '€', 'INR': '₹', 'GBP': '£', 'JPY': '¥', 'CNY': '¥', 'CAD': 'C$', 'AUD': 'A$'
  };
  const currencySymbol = currencySymbols[user?.currency] || '$';

  const fetchData = async () => {
    try {
      // Fetch more transactions to ensure local stats are reasonably accurate if fallback is needed
      const [expensesRes, statsRes] = await Promise.all([
        expenseService.getExpenses({ limit: 50, sort: '-date' }),
        expenseService.getStats()
      ]);

      let backendStats = { income: 0, expense: 0 };
      const fetchedExpenses = expensesRes.data.success ? expensesRes.data.data.expenses : [];

      if (expensesRes.data.success) {
        const grouped = groupExpensesByDate(fetchedExpenses);
        setSections(grouped);
      }

      if (statsRes.data.success) {
        const stats = statsRes.data.data;
        if (Array.isArray(stats)) {
          stats.forEach(s => {
            if (s._id === 'income') backendStats.income += parseFloat(s.total) || 0;
            if (s._id === 'expense') backendStats.expense += parseFloat(s.total) || 0;
          });
        } else {
          backendStats.income = parseFloat(stats.totalIncome) || 0;
          backendStats.expense = parseFloat(stats.totalExpense) || 0;
        }
      }

      // Fallback: If backend stats are 0, calculate from fetched expenses (up to limit)
      if (backendStats.income === 0 && backendStats.expense === 0 && fetchedExpenses.length > 0) {
        fetchedExpenses.forEach(exp => {
          if (exp.type === 'income') backendStats.income += exp.amount;
          if (exp.type === 'expense') backendStats.expense += exp.amount;
        });
      }

      setSummary({
        income: backendStats.income,
        expense: backendStats.expense,
        balance: backendStats.income - backendStats.expense
      });

    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const groupExpensesByDate = (expenses) => {
    const groups = expenses.reduce((acc, expense) => {
      const dateObj = new Date(expense.date);
      const dateStr = dateObj.toLocaleDateString(undefined, {
        weekday: 'long', month: 'short', day: 'numeric'
      });

      if (!acc[dateStr]) {
        acc[dateStr] = [];
      }
      acc[dateStr].push(expense);
      return acc;
    }, {});

    return Object.keys(groups).map(date => ({
      title: date,
      data: groups[date]
    }));
  };

  const formatAmount = (amount) => {
    const locale = user?.currency === 'INR' ? 'en-IN' : 'en-US';
    // Handle potential undefined/null
    const val = amount || 0;
    try {
      return val.toLocaleString(locale, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      });
    } catch (e) {
      return val.toFixed(2);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [])
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchData();
  }, []);

  const getCategoryColor = (name) => {
    const colorsList = ['#F59E0B', '#10B981', '#3B82F6', '#EF4444', '#8B5CF6', '#EC4899', '#6366F1'];
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colorsList[Math.abs(hash) % colorsList.length];
  };

  const confirmDelete = async () => {
    try {
      setLoading(true);
      await expenseService.deleteExpense(deleteExpenseId);
      setShowDeleteAlert(false);
      setDeleteExpenseId(null);
      // Refresh data
      fetchData();
    } catch (error) {
      setLoading(false);
      // Could show error alert here
      console.error('Failed to delete transaction:', error);
    }
  };

  const handleExpensePress = (item) => {
    setSelectedExpense(item);
    setShowActionSheet(true);
  };

  const renderExpense = ({ item }) => {
    const categoryName = item.category?.name || 'Uncategorized';
    const catColor = getCategoryColor(categoryName);

    return (
      <TouchableOpacity
        style={[styles.card, { backgroundColor: colors.card }]}
        onPress={() => handleExpensePress(item)}
      >
        <View style={[styles.iconContainer, { backgroundColor: `${catColor}20` }]}>
          <Text style={[styles.iconText, { color: catColor }]}>{categoryName.charAt(0).toUpperCase()}</Text>
        </View>

        <View style={styles.cardInfo}>
          <Text style={[styles.category, { color: colors.text }]}>{categoryName}</Text>
          {item.description ? (
            <Text style={[styles.desc, { color: colors.subText }]} numberOfLines={1}>{item.description}</Text>
          ) : null}
        </View>

        <View style={styles.amountContainer}>
          <Text style={[styles.amount, { color: item.type === 'income' ? colors.success : colors.danger }]}>
            {item.type === 'income' ? '+' : '-'}{currencySymbol}{formatAmount(item.amount)}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  const renderSectionHeader = ({ section: { title } }) => (
    <Text style={[styles.sectionHeader, { color: colors.subText, backgroundColor: colors.background }]}>{title}</Text>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} backgroundColor={colors.primary} />

      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.primary }]}>
        <View>
          <Text style={styles.headerTitle}>Dashboard</Text>
          <Text style={styles.subHeader}>Welcome, {user?.name || 'User'}</Text>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <TouchableOpacity onPress={() => toggleTheme(isDark ? 'light' : 'dark')} style={{ marginRight: 15 }}>
            <Text style={{ fontSize: 20 }}>{isDark ? '☀️' : '🌙'}</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={signOut}>
            <Text style={{ color: 'white', fontWeight: 'bold' }}>Logout</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Summary Cards */}
      <View style={styles.summaryContainer}>
        <View style={[styles.summaryBox, {
          backgroundColor: isDark ? '#065f46' : '#d1fae5',
          borderColor: isDark ? '#10b981' : '#6ee7b7',
          borderWidth: 1
        }]}>
          <Text style={[styles.summaryLabel, { color: isDark ? '#d1fae5' : '#065f46' }]}>Income</Text>
          <Text style={[styles.summaryValue, { color: isDark ? '#6ee7b7' : '#047857' }]}>
            +{currencySymbol}{formatAmount(summary.income)}
          </Text>
        </View>
        <View style={[styles.summaryBox, {
          backgroundColor: isDark ? '#991b1b' : '#fee2e2',
          borderColor: isDark ? '#ef4444' : '#fca5a5',
          borderWidth: 1
        }]}>
          <Text style={[styles.summaryLabel, { color: isDark ? '#fecaca' : '#991b1b' }]}>Expense</Text>
          <Text style={[styles.summaryValue, { color: isDark ? '#fca5a5' : '#b91c1c' }]}>
            -{currencySymbol}{formatAmount(summary.expense)}
          </Text>
        </View>
      </View>

      {/* Balance */}
      <View style={[styles.balanceCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Text style={[styles.balanceLabel, { color: colors.subText }]}>Total Balance</Text>
        <Text style={[styles.balanceValue, { color: summary.balance >= 0 ? colors.success : colors.danger }]}>
          {currencySymbol}{formatAmount(summary.balance)}
        </Text>
      </View>

      <View style={styles.actionContainer}>
        <TouchableOpacity
          style={[styles.addButton, { backgroundColor: colors.primary }]}
          onPress={() => navigation.navigate('AddExpense')}
        >
          <Text style={styles.addButtonText}>+ Add Transaction</Text>
        </TouchableOpacity>
      </View>

      <View style={{ flex: 1 }}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Recent Transactions</Text>

        {loading ? (
          <ActivityIndicator size="large" color={colors.primary} />
        ) : (
          <SectionList
            sections={sections}
            renderItem={renderExpense}
            renderSectionHeader={renderSectionHeader}
            keyExtractor={item => item._id}
            contentContainerStyle={{ paddingBottom: 20 }}
            stickySectionHeadersEnabled={false}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor={colors.primary}
                colors={[colors.primary]}
              />
            }
            ListEmptyComponent={
              <Text style={{ textAlign: 'center', marginTop: 20, color: colors.subText }}>
                No transactions found.
              </Text>
            }
          />
        )}
      </View>

      {/* Action Sheet for Transaction Options */}
      <ActionSheet
        visible={showActionSheet}
        onClose={() => setShowActionSheet(false)}
        title="Transaction Options"
        subtitle={selectedExpense ? `${selectedExpense.category?.name || 'Uncategorized'} - ${currencySymbol}${formatAmount(selectedExpense.amount)}` : ''}
        options={[
          {
            text: 'Edit Transaction',
            icon: 'edit',
            style: 'secondary',
            onPress: () => {
              navigation.navigate('AddExpense', { expense: selectedExpense });
            }
          },
          {
            text: 'Delete Transaction',
            icon: 'delete',
            style: 'destructive',
            onPress: () => {
              setDeleteExpenseId(selectedExpense._id);
              setShowDeleteAlert(true);
            }
          }
        ]}
      />

      {/* Delete Confirmation Alert */}
      <CustomAlert
        visible={showDeleteAlert}
        type="danger"
        title="Delete Transaction"
        message="Are you sure you want to delete this transaction? This action cannot be undone."
        buttons={[
          {
            text: 'Cancel',
            style: 'cancel',
            onPress: () => {
              setShowDeleteAlert(false);
              setDeleteExpenseId(null);
            }
          },
          {
            text: 'Delete',
            style: 'destructive',
            onPress: confirmDelete
          }
        ]}
        onClose={() => {
          setShowDeleteAlert(false);
          setDeleteExpenseId(null);
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 15, paddingTop: 10 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
    padding: 15,
    borderRadius: 16,
    marginTop: 35,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  headerTitle: { fontSize: 22, fontWeight: '800', color: 'white' },
  subHeader: { color: '#e0e7ff', fontSize: 13, marginTop: 2 },
  summaryContainer: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  summaryBox: { flex: 0.48, padding: 12, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  summaryLabel: { fontSize: 12, fontWeight: '600', marginBottom: 4 },
  summaryValue: { fontSize: 16, fontWeight: '800' },
  balanceCard: {
    padding: 12,
    borderRadius: 16,
    alignItems: 'center',
    marginBottom: 15,
    borderWidth: 1,
  },
  balanceLabel: { fontSize: 13, fontWeight: '500' },
  balanceValue: { fontSize: 22, fontWeight: '800', marginTop: 2 },
  sectionTitle: { fontSize: 18, fontWeight: '700', marginBottom: 10 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 16,
    marginBottom: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  iconContainer: {
    width: 42,
    height: 42,
    borderRadius: 21,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  iconText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  cardInfo: { flex: 1 },
  category: { fontSize: 15, fontWeight: '600', marginBottom: 2 },
  desc: { fontSize: 12 },
  amountContainer: { alignItems: 'flex-end' },
  amount: { fontSize: 15, fontWeight: '700' },
  sectionHeader: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 8,
    marginTop: 8,
    paddingVertical: 4,
    opacity: 0.7,
    textTransform: 'uppercase'
  },
  actionContainer: { marginBottom: 15 },
  addButton: { padding: 14, borderRadius: 14, alignItems: 'center', shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 4 },
  addButtonText: { color: 'white', fontWeight: 'bold', fontSize: 15 }
});