// client/src/context/AccountContext.jsx
import { createContext, useContext, useState, useCallback, useEffect } from 'react'
import { accountService } from '../services/accountService'
import { useAuth } from './AuthContext'

const AccountContext = createContext(null)

export function AccountProvider({ children }) {
  const { user } = useAuth()
  const [accounts, setAccounts] = useState([])
  const [totalBalance, setTotalBalance] = useState(0)
  const [loading, setLoading] = useState(false)

  const loadAccounts = useCallback(async (includeArchived = false) => {
    setLoading(true)
    try {
      const res = await accountService.list(includeArchived)
      const list = res.data?.data?.accounts || []
      setAccounts(list)
      setTotalBalance(res.data?.data?.totalBalance ?? 0)
      return list
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (user) loadAccounts(false)
  }, [user, loadAccounts])

  const createAccount = useCallback(async (body) => {
    const res = await accountService.create(body)
    await loadAccounts(false)
    return res.data?.data?.account
  }, [loadAccounts])

  const updateAccount = useCallback(async (id, body) => {
    const res = await accountService.update(id, body)
    await loadAccounts(false)
    return res.data?.data?.account
  }, [loadAccounts])

  const deleteAccount = useCallback(async (id) => {
    await accountService.remove(id)
    await loadAccounts(false)
  }, [loadAccounts])

  const reconcile = useCallback(async (id, targetBalance) => {
    const res = await accountService.reconcile(id, targetBalance)
    await loadAccounts(false)
    return res.data?.data
  }, [loadAccounts])

  const visible = accounts.filter((a) => !a.archived)
  const archivedAccounts = accounts.filter((a) => a.archived)
  const defaultAccountId = visible.find((a) => a.isDefault)?._id || visible[0]?._id || null

  return (
    <AccountContext.Provider
      value={{
        accounts: visible,
        archivedAccounts,
        defaultAccountId,
        totalBalance,
        loading,
        loadAccounts,
        createAccount,
        updateAccount,
        deleteAccount,
        reconcile,
      }}
    >
      {children}
    </AccountContext.Provider>
  )
}

export function useAccounts() {
  const ctx = useContext(AccountContext)
  if (!ctx) throw new Error('useAccounts must be used within AccountProvider')
  return ctx
}
