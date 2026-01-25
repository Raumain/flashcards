import { createServerFn } from '@tanstack/react-start'
import type { AuthContext } from '../middleware'
import { authMiddleware } from '../middleware'

/**
 * Get current authenticated user's information
 * Protected server function - requires authentication
 */
export const getCurrentUser = createServerFn({ method: 'GET' })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const { user } = context as AuthContext

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      image: user.image,
      emailVerified: user.emailVerified,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    }
  })
