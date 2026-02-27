import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./vitest.setup.ts'],
    exclude: ['tests/e2e/**', 'node_modules/**'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      reportsDirectory: './coverage',
      include: [
        'actions/**',
        'lib/**',
        'providers/**',
        'queries/**',
        'app/api/**',
        'hooks/**',
      ],
      exclude: [
        '**/*.d.ts',
        'tests/**',
        '**/*.config.*',
        'node_modules/**',
      ],
      thresholds: {
        lines: 30,
        branches: 30,
        functions: 30,
        statements: 30,
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
      // Stub server-only module so server modules can be tested
      'server-only': path.resolve(__dirname, 'tests/stubs/server-only.ts'),
    },
  },
})
