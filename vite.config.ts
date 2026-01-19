import tailwindcss from '@tailwindcss/vite'
import { tanstackStart } from '@tanstack/react-start/plugin/vite'
import viteReact from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import tsconfigPaths from 'vite-tsconfig-paths'

export default defineConfig({
	server: {
		port: 3000,
	},
	plugins: [tailwindcss(), tsconfigPaths(), tanstackStart(), viteReact()],
	build: {
		// Enable minification
		minify: 'esbuild',
		// Target modern browsers
		target: 'es2022',
		// Generate source maps for production debugging
		sourcemap: false,
		// Chunk size warning threshold (PDF libs are lazy loaded so acceptable)
		chunkSizeWarningLimit: 600,
	},
	// Optimize dependencies
	optimizeDeps: {
		include: ['react', 'react-dom', '@tanstack/react-router'],
	},
})
