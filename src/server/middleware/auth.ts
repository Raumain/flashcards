import { createMiddleware } from '@tanstack/react-start'
import { getRequest } from '@tanstack/react-start/server'
import { auth } from '~/lib/auth'

/**
 * Auth middleware for protecting server functions
 * Adds user and session to context when authenticated
 */
export const authMiddleware = createMiddleware({ type: 'function' }).server(
  async ({ next }) => {
    const request = getRequest()
    const session = await auth.api.getSession({
      headers: request.headers,
    })

    if (!session) {
      throw new Error('Non autorisé')
    }

    return next({
      context: {
        user: session.user,
        session: session.session,
      },
    })
  },
)

/**
 * Optional auth middleware - does not throw if unauthenticated
 * Adds user and session to context if authenticated, null otherwise
 */
export const optionalAuthMiddleware = createMiddleware({
  type: 'function',
}).server(async ({ next }) => {
  const request = getRequest()
  const session = await auth.api.getSession({
    headers: request.headers,
  })

  return next({
    context: {
      user: session?.user ?? null,
      session: session?.session ?? null,
    },
  })
})

/**
 * Session type from better-auth
 */
type SessionResult = Awaited<ReturnType<typeof auth.api.getSession>>

/**
 * Type helpers for middleware context
 */
export type AuthContext = {
  user: NonNullable<SessionResult>['user']
  session: NonNullable<SessionResult>['session']
}

export type OptionalAuthContext = {
  user: NonNullable<SessionResult>['user'] | null
  session: NonNullable<SessionResult>['session'] | null
}
