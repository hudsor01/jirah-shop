import * as Sentry from "@sentry/nextjs"
import { SENTRY_DSN, SENTRY_ENVIRONMENT, SENTRY_TRACES_SAMPLE_RATE } from "@/lib/sentry"

if (SENTRY_DSN) {
  Sentry.init({
    dsn: SENTRY_DSN,
    environment: SENTRY_ENVIRONMENT,
    tracesSampleRate: SENTRY_TRACES_SAMPLE_RATE,
    debug: false,
  })
}
