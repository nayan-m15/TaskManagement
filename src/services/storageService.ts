export function getStorageItem<TValue>(key: string): TValue | null {
  try {
    const rawValue = window.localStorage.getItem(key)
    return rawValue ? (JSON.parse(rawValue) as TValue) : null
  } catch {
    return null
  }
}

export function setStorageItem<TValue>(key: string, value: TValue) {
  window.localStorage.setItem(key, JSON.stringify(value))
}

export function removeStorageItem(key: string) {
  window.localStorage.removeItem(key)
}
