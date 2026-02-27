import '@testing-library/jest-dom'

// Set environment variables needed by modules that read them at import time
process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co'
process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = 'test-publishable-key'
process.env.NEXT_PUBLIC_SITE_URL = 'http://localhost:3000'
process.env.STRIPE_SECRET_KEY = 'sk_test_fake_key'
process.env.STRIPE_WEBHOOK_SECRET = 'whsec_test_fake_secret'
process.env.RESEND_API_KEY = 'test-resend-api-key'
process.env.ADMIN_EMAIL = 'admin@test.com'

// Mock window.matchMedia (some components use media queries)
if (typeof window !== 'undefined') {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: (query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    }),
  })
}
