import { useEffect, useState } from 'react'

export function useLocalStorage<TValue>(key: string, initialValue: TValue) {
  const [storedValue, setStoredValue] = useState<TValue>(() => {
    try {
      const item = window.localStorage.getItem(key)
      return item ? (JSON.parse(item) as TValue) : initialValue
    } catch {
      return initialValue
    }
  })

  useEffect(() => {
    try {
      window.localStorage.setItem(key, JSON.stringify(storedValue))
    } catch {
      // TODO: surface storage quota and serialization failures via monitoring.
    }
  }, [key, storedValue])

  return [storedValue, setStoredValue] as const
}
