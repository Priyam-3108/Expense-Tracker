import { useState } from 'react'

// "Leave savings and investments out of spending" — remembered per device, shared by Dashboard and Analytics
export function useExcludeSavings() {
  const [exclude, setExclude] = useState(() => localStorage.getItem('excludeSavings') === '1')
  const set = (value) => {
    setExclude(value)
    localStorage.setItem('excludeSavings', value ? '1' : '0')
  }
  return [exclude, set]
}
