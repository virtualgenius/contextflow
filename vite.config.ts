import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { readFileSync } from 'fs'

const pkg = JSON.parse(readFileSync('./package.json', 'utf-8'))

export default defineConfig({
  plugins: [react()],
  base: '/',
  define: {
    __APP_VERSION__: JSON.stringify(pkg.version),
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
    coverage: {
      provider: 'v8',
      reporter: ['text-summary', 'html', 'lcov'],
      reportsDirectory: 'coverage',
      include: ['src/**/*.{ts,tsx}', 'workers/**/*.ts'],
      exclude: [
        '**/*.test.{ts,tsx}',
        '**/__tests__/**',
        'src/test/**',
        'src/**/*.d.ts',
        'src/components/ui/**',
        'src/main.tsx',
      ],
      // Gate only the data-critical paths. Measured Oct 14, 2026:
      // sync layer 89/88/75, store.ts 71/50/67 (lines/branches/functions).
      thresholds: {
        'src/model/sync/**': { lines: 85, branches: 80, functions: 70 },
        'src/model/store.ts': { lines: 65, branches: 45, functions: 60 },
      },
    },
  },
})
