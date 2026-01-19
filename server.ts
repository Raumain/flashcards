/**
 * Production server for TanStack Start
 * Serves static assets from dist/client and SSR from dist/server
 */

import { stat } from 'node:fs/promises'
import { dirname, extname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

// Get the directory of the current module
const __dirname = dirname(fileURLToPath(import.meta.url))

// Import the SSR handler
const handler = await import('./dist/server/server.js')

const PORT = Number(process.env.PORT) || 3000
const HOST = process.env.HOST || '0.0.0.0'

// MIME types for static files
const MIME_TYPES: Record<string, string> = {
	'.html': 'text/html',
	'.js': 'application/javascript',
	'.mjs': 'application/javascript',
	'.css': 'text/css',
	'.json': 'application/json',
	'.png': 'image/png',
	'.jpg': 'image/jpeg',
	'.jpeg': 'image/jpeg',
	'.gif': 'image/gif',
	'.svg': 'image/svg+xml',
	'.ico': 'image/x-icon',
	'.webp': 'image/webp',
	'.woff': 'font/woff',
	'.woff2': 'font/woff2',
	'.ttf': 'font/ttf',
	'.eot': 'application/vnd.ms-fontobject',
	'.otf': 'font/otf',
	'.map': 'application/json',
}

// Static file serving
async function serveStatic(pathname: string): Promise<Response | null> {
	// Only serve from /assets path
	if (!pathname.startsWith('/assets/')) {
		return null
	}

	// Use __dirname for reliable path resolution
	const filePath = join(__dirname, 'dist/client', pathname)

	try {
		const fileStat = await stat(filePath)
		if (!fileStat.isFile()) {
			return null
		}

		const file = Bun.file(filePath)
		const ext = extname(filePath)
		const contentType = MIME_TYPES[ext] || 'application/octet-stream'

		return new Response(file, {
			headers: {
				'Content-Type': contentType,
				'Cache-Control': 'public, max-age=31536000, immutable',
			},
		})
	} catch {
		return null
	}
}

// Main server
Bun.serve({
	port: PORT,
	hostname: HOST,
	async fetch(request: Request): Promise<Response> {
		const url = new URL(request.url)
		const pathname = url.pathname

		// Try static files first
		const staticResponse = await serveStatic(pathname)
		if (staticResponse) {
			return staticResponse
		}

		// Fall through to SSR handler
		try {
			return await handler.default.fetch(request)
		} catch (error) {
			console.error('SSR Error:', error)
			return new Response('Internal Server Error', { status: 500 })
		}
	},
})

console.log(`🚀 MedFlash server running at http://${HOST}:${PORT}`)
