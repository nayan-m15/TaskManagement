export function isValidEmail(email: string) {
  return /\S+@\S+\.\S+/.test(email)
}

export function isRequiredValue(value: string) {
  return value.trim().length > 0
}
