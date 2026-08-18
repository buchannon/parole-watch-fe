type Level = 'info' | 'warn' | 'error'

function log(level: Level, message: string, ...extra: unknown[]): void {
  const args = ['[parole-watch]', message, ...extra]
  switch (level) {
    case 'error':
      console.error(...args)
      break
    case 'warn':
      console.warn(...args)
      break
    default:
      console.info(...args)
  }
}

export const logInfo = (message: string, ...extra: unknown[]): void => log('info', message, ...extra)
export const logWarn = (message: string, ...extra: unknown[]): void => log('warn', message, ...extra)
export const logError = (message: string, ...extra: unknown[]): void => log('error', message, ...extra)
