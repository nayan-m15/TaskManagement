export function noop() {
  // TODO: replace noop placeholders as the feature modules gain real behavior.
}

export function toErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : 'Something went wrong'
}
