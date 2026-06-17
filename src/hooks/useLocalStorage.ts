import { useEffect, useState } from 'react'

type InitialValue<TValue> = TValue | (() => TValue)

export function useLocalStorage<TValue>(key: string, initialValue: InitialValue<TValue>) {
  const [storedValue, setStoredValue] = useState<TValue>(() => {
    const resolvedInitialValue =
      typeof initialValue === 'function'
        ? (initialValue as () => TValue)()
        : initialValue

    try {
      const item = window.localStorage.getItem(key)
      return item ? (JSON.parse(item) as TValue) : resolvedInitialValue
    } catch {
      return resolvedInitialValue
    }
  })

  useEffect(() => {
    try {
      window.localStorage.setItem(key, JSON.stringify(storedValue))
    } catch {
      // Ignore storage write failures so the UI keeps working in restricted environments.
    }
  }, [key, storedValue])

  return [storedValue, setStoredValue] as const
}
