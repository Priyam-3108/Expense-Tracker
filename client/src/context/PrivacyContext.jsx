// client/src/context/PrivacyContext.jsx
import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { useAuth } from './AuthContext'

const PrivacyContext = createContext({ isPrivate: false, setPrivate: () => {}, toggle: () => {} })

function readStored() {
  try {
    const v = localStorage.getItem('privacyMode')
    if (v === '1') return true
    if (v === '0') return false
  } catch {
    /* ignore */
  }
  return null
}

function writeStored(val) {
  try {
    localStorage.setItem('privacyMode', val ? '1' : '0')
  } catch {
    /* ignore */
  }
}

export function PrivacyProvider({ children }) {
  const { user } = useAuth()
  const [isPrivate, setIsPrivate] = useState(() => {
    const stored = readStored()
    if (stored !== null) return stored
    return false
  })
  const [adoptedDefault, setAdoptedDefault] = useState(readStored() !== null)

  // Adopt the server default once, if the user has no per-device choice yet.
  useEffect(() => {
    if (adoptedDefault) return
    if (user && typeof user.privacyModeDefault === 'boolean') {
      setIsPrivate(user.privacyModeDefault)
      setAdoptedDefault(true)
    }
  }, [user, adoptedDefault])

  const setPrivate = useCallback((val) => {
    setIsPrivate(!!val)
    writeStored(!!val)
    setAdoptedDefault(true)
  }, [])

  const toggle = useCallback(() => {
    setIsPrivate((prev) => {
      const next = !prev
      writeStored(next)
      return next
    })
    setAdoptedDefault(true)
  }, [])

  return (
    <PrivacyContext.Provider value={{ isPrivate, setPrivate, toggle }}>
      {children}
    </PrivacyContext.Provider>
  )
}

export function usePrivacy() {
  return useContext(PrivacyContext)
}
