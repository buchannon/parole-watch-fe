export const PASSWORD_MIN_LENGTH = 8

const CLASSES = [
  /[a-z]/,
  /[A-Z]/,
  /\d/,
  /[^a-zA-Z\d]/,
] as const

export interface PasswordValidation {
  valid: boolean
  errors: string[]
  score: number
  label: 'Weak' | 'Medium' | 'Strong'
}

export function validatePassword(value: string): PasswordValidation {
  const errors: string[] = []
  if (value.length < PASSWORD_MIN_LENGTH) {
    errors.push(`Use at least ${PASSWORD_MIN_LENGTH} characters.`)
  }
  const matched = CLASSES.filter((regex) => regex.test(value)).length
  if (matched < 3) {
    errors.push('Include at least 3 of: lowercase, uppercase, digit, symbol.')
  }
  if (errors.length > 0) {
    return { valid: false, errors, score: 0, label: 'Weak' }
  }
  return {
    valid: true,
    errors,
    score: matched,
    label: matched === 4 ? 'Strong' : 'Medium',
  }
}
