import * as Sentry from '@sentry/nextjs'

type LogLevel = 'info' | 'warn' | 'error'
type LogContext = Record<string, unknown>

function log(level: LogLevel, message: string, context?: LogContext) {
  const entry = {
    level,
    message,
    timestamp: new Date().toISOString(),
    ...context,
  }
  if (level === 'error') {
    console.error(JSON.stringify(entry))
    Sentry.captureMessage(message, { level: 'error', extra: context })
  } else if (level === 'warn') {
    console.warn(JSON.stringify(entry))
  } else {
    console.log(JSON.stringify(entry))
  }
}

export const logger = {
  info: (message: string, context?: LogContext) => log('info', message, context),
  warn: (message: string, context?: LogContext) => log('warn', message, context),
  error: (message: string, context?: LogContext) => log('error', message, context),
  /** Capture an actual Error object with full stack trace */
  exception: (err: unknown, context?: LogContext) => {
    const message = err instanceof Error ? err.message : String(err)
    console.error(JSON.stringify({ level: 'error', message, timestamp: new Date().toISOString(), ...context }))
    Sentry.captureException(err, { extra: context })
  },
}
