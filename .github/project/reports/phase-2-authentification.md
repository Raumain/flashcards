# Phase 2 – Authentification Review (2026-01-25)

## Status by Task
- **2.1 Endpoint API better-auth**: Partially implemented. Endpoint exists at [src/routes/api/auth/$.ts](src/routes/api/auth/%24.ts#L1-L14) but the route is not a catch-all; paths like `/api/auth/sign-in/email` will not match because the current segment param cannot span multiple subpaths. Needs a splat route (e.g., `routes/api/auth/[...all].ts` or `/api/auth/$all`) that forwards all methods to `auth.handler`.
- **2.2 Page inscription**: Implemented at [src/routes/signup.tsx](src/routes/signup.tsx#L1-L200) with TanStack Form + Zod validation. Success redirect currently goes to `/` instead of `/dashboard` as specified. Error mapping in FR present.
- **2.3 Page connexion**: Implemented at [src/routes/signin.tsx](src/routes/signin.tsx#L1-L200) with validation and error display. Success redirect goes to `/` instead of `/dashboard` and no redirect on unauthenticated access to protected areas.
- **2.4 OAuth Google buttons**: Implemented in [src/components/auth/SocialButtons.tsx](src/components/auth/SocialButtons.tsx#L1-L120) using `signIn.social` with Google. UI matches spec.
- **2.5 Middleware protection**: Server functions are protected via [src/server/middleware/auth.ts](src/server/middleware/auth.ts#L1-L60). However, page routes (`/dashboard/*`, `/study/*`, `/revision/*`) are not guarded; unauthenticated users can load the pages and only see a message instead of being redirected to `/signin`.
- **2.6 UserMenu**: Implemented in [src/components/layout/UserMenu.tsx](src/components/layout/UserMenu.tsx#L1-L200) with avatar, menu, and sign-out. Shows "Connexion" when logged out.
- **2.7 Page paramètres**: Implemented in [src/routes/dashboard/settings.tsx](src/routes/dashboard/settings.tsx#L1-L220) with profile name update and account deletion. Missing required sections: password change flow, linked OAuth accounts listing, and more granular security controls.

## Gaps / Risks
- **Routing mismatch for better-auth**: Current `/api/auth/$` route will not proxy nested better-auth endpoints; auth flows (sign-in/up/session, OAuth callbacks) will 404. Must switch to a true catch-all route.
- **Protected route UX/Security**: No redirect enforcement for protected pages; users without a session remain on the page. Need route-level guards (loader/beforeLoad) to redirect to `/signin` and avoid flashing protected UI.
- **Redirect targets**: Sign-in and sign-up success should route to `/dashboard`, not `/`.
- **Settings coverage**: Password change and linked accounts management are absent; spec requires these controls.

## Test & Lint
- Lint/TypeScript not run in this phase review; project currently has outstanding Biome issues (see Phase 1 report). Tests not executed yet.

## Recommended Actions
1. Replace `src/routes/api/auth/$.ts` with a catch-all auth route that forwards GET/POST to `auth.handler` for all subpaths.
2. Add route guards for `/dashboard/*`, `/study/*`, `/revision/*` to redirect unauthenticated users to `/signin` (and optionally preserve `redirectTo`).
3. Update success redirects in signin/signup flows to `/dashboard`.
4. Extend settings page with password change (email/password users) and linked OAuth provider display/management per spec.
5. Run full lint (`bun run lint`) and tests after addressing the above to ensure TS and Biome are clean.
