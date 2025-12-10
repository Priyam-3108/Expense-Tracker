import React, { useEffect, useState, useContext, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, RefreshControl, StatusBar, ScrollView } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { AuthContext } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { expenseService } from '../services/expenseService';
import CustomAlert from '../components/CustomAlert';
import ActionSheet from '../components/ActionSheet';
import BalanceCard from '../components/BalanceCard';
import SummaryCard from '../components/SummaryCard';
import FloatingActionButton from '../components/FloatingActionButton';
import EmptyState from '../components/EmptyState';
import TransactionItem from '../components/TransactionItem';
import { SkeletonCard, SkeletonTransactionItem } from '../components/SkeletonLoader';
import hapticFeedback from '../utils/haptics';

export default function DashboardScreen({ navigation }) {
  const { signOut, user } = useContext(AuthContext);
  const { theme, toggleTheme, isDark, colors, spacing, borderRadius, shadows } = useTheme();
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [summary, setSummary] = useState({ income: 0, expense: 0, balance: 0 });

  // Action Sheet & Alert States
  const [showActionSheet, setShowActionSheet] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState(null);
  const [showDeleteAlert, setShowDeleteAlert] = useState(false);
  const [deleteExpenseId, setDeleteExpenseId] = useState(null);

  const fetchData = async () => {
    try {
      const [expensesRes, statsRes] = await Promise.all([
        expenseService.getExpenses({ limit: 50, sort: '-date' }),
        expenseService.getStats()
      ]);

      let backendStats = { income: 0, expense: 0 };
      const fetchedExpenses = expensesRes.data.success ? expensesRes.data.data.expenses : [];

      if (expensesRes.data.success) {
        setTransactions(fetchedExpenses);
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

      // Fallback: If backend stats are 0, calculate from fetched expenses
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

  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [])
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchData();
  }, []);

  const confirmDelete = async () => {
    try {
      setLoading(true);
      await expenseService.deleteExpense(deleteExpenseId);
      setShowDeleteAlert(false);
      setDeleteExpenseId(null);
      fetchData();
    } catch (error) {
      setLoading(false);
      console.error('Failed to delete transaction:', error);
    }
  };

  const handleExpensePress = (item) => {
    setSelectedExpense(item);
    setShowActionSheet(true);
  };

  const handleEdit = (item) => {
    hapticFeedback.light();
    navigation.navigate('AddExpense', { expense: item });
  };

  const handleDelete = (item) => {
    hapticFeedback.light();
    setDeleteExpenseId(item._id);
    setShowDeleteAlert(true);
  };

  const renderHeader = () => (
    <View>
      {/* Top Header */}
      <View style={styles.topHeader}>
        <View>
          <Text style={[styles.greeting, { color: colors.textSecondary }]}>
            Welcome back,
          </Text>
          <Text style={[styles.userName, { color: colors.text }]}>
            {user?.name || 'User'}
          </Text>
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity
            onPress={() => {
              hapticFeedback.light();
              toggleTheme(isDark ? 'light' : 'dark');
            }}
            style={[styles.iconButton, { backgroundColor: colors.card }]}
          >
            <Ionicons
              name={isDark ? 'sunny' : 'moon'}
              size={20}
              color={colors.text}
            />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => {
              hapticFeedback.medium();
              signOut();
            }}
            style={[styles.iconButton, { backgroundColor: colors.card }]}
          >
            <Ionicons name="log-out-outline" size={20} color={colors.danger} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Balance Card */}
      <BalanceCard
        balance={summary.balance}
        onPress={() => {
          hapticFeedback.light();
        }}
      />

      {/* Summary Cards */}
      <View style={styles.summaryRow}>
        <SummaryCard
          title="Income"
          amount={summary.income}
          type="income"
          icon="trending-up"
        />
        <View style={{ width: spacing.md }} />
        <SummaryCard
          title="Expense"
          amount={summary.expense}
          type="expense"
          icon="trending-down"
        />
      </View>

      {/* Recent Transactions Header */}
      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          Recent Transactions
        </Text>
        <TouchableOpacity
          onPress={() => {
            hapticFeedback.light();
            // Navigate to search/filter screen
          }}
        >
          <Ionicons name="search" size={22} color={colors.primary} />
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderTransaction = ({ item }) => (
    <TransactionItem
      item={item}
      onPress={handleExpensePress}
      onEdit={handleEdit}
      onDelete={handleDelete}
    />
  );

  const renderEmpty = () => (
    <EmptyState
      icon="receipt-outline"
      title="No Transactions Yet"
      subtitle="Start tracking your expenses by adding your first transaction"
      action={
        <TouchableOpacity
          style={[styles.emptyButton, { backgroundColor: colors.primary }]}
          onPress={() => {
            hapticFeedback.medium();
            navigation.navigate('AddExpense');
          }}
        >
          <Text style={styles.emptyButtonText}>Add Transaction</Text>
        </TouchableOpacity>
      }
    />
  );

  const renderLoading = () => (
    <ScrollView style={styles.container}>
      <View style={styles.topHeader}>
        <View>
          <Text style={[styles.greeting, { color: colors.textSecondary }]}>
            Welcome back,
          </Text>
          <Text style={[styles.userName, { color: colors.text }]}>
            {user?.name || 'User'}
          </Text>
        </View>
      </View>
      <SkeletonCard />
      <View style={styles.summaryRow}>
        <SkeletonCard />
        <View style={{ width: spacing.md }} />
        <SkeletonCard />
      </View>
      <View style={{ marginTop: spacing.lg }}>
        <SkeletonTransactionItem />
        <SkeletonTransactionItem />
        <SkeletonTransactionItem />
        <SkeletonTransactionItem />
      </View>
    </ScrollView>
  );

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
        {renderLoading()}
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

      <FlatList
        data={transactions}
        renderItem={renderTransaction}
        keyExtractor={item => item._id}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={renderEmpty}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
      />

      {/* Floating Action Button */}
      <FloatingActionButton
        onPress={() => {
          navigation.navigate('AddExpense');
        }}
        icon="add"
      />

      {/* Action Sheet for Transaction Options */}
      <ActionSheet
        visible={showActionSheet}
        onClose={() => setShowActionSheet(false)}
        title="Transaction Options"
        subtitle={selectedExpense ? `${selectedExpense.category?.name || 'Uncategorized'} - ₹${selectedExpense.amount}` : ''}
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
  container: {
    flex: 1,
  },
  listContent: {
    padding: 20,
    paddingTop: 50,
    paddingBottom: 100,
  },
  topHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  greeting: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 4,
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  headerActions: {
    flexDirection: 'row',
    gap: 12,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  summaryRow: {
    flexDirection: 'row',
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  emptyButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  emptyButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
});