import { resolve } from 'node:path'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'

export default defineConfig({
	plugins: [react()],
	resolve: {
		alias: {
			'~': resolve(__dirname, './src'),
		},
	},
	test: {
		globals: true,
		environment: 'happy-dom',
		include: ['src/**/*.{test,spec}.{ts,tsx}', 'tests/**/*.{test,spec}.{ts,tsx}'],
		exclude: ['node_modules', 'dist'],
		coverage: {
			provider: 'v8',
			reporter: ['text', 'json', 'html'],
			exclude: [
				'node_modules',
				'src/routeTree.gen.ts',
				'**/*.d.ts',
				'**/*.config.*',
				'**/entry-*.tsx',
			],
		},
		setupFiles: ['./tests/setup.ts'],
	},
})
