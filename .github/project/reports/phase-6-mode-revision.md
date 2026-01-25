# Phase 6 – Mode Révision Review (2026-01-25)

## Status by Task
- **6.1 getRevisionCards**: Implemented at [src/server/functions/study.ts](src/server/functions/study.ts#L87-L121). Fetches user flashcards, aggregates incorrect counts, filters by threshold, orders desc, returns thematic metadata and stats. Validator expects `{ threshold }` but callers send `{ data: { threshold } }`, causing likely validation failure (see Gaps).
- **6.2 Route /revision configuration**: Implemented at [src/routes/revision/index.tsx](src/routes/revision/index.tsx#L12-L129). Slider controls threshold, previews up to 10 cards with count, empty state CTA, start button disabled via guard when no cards. Query calls `getRevisionCards` with `{ data: { threshold } }` (shape mismatch with validator).
- **6.3 ThresholdSlider**: Implemented at [src/components/study/ThresholdSlider.tsx](src/components/study/ThresholdSlider.tsx#L1-L38). Provides min/max, value display, helper text. Lacks `aria-describedby` linking helper text to the input.
- **6.4 Route /revision/session**: Implemented at [src/routes/revision/session.tsx](src/routes/revision/session.tsx#L24-L209). Loads revision cards (shuffled), swipe flow with progress, records results, complete/empty/loading states present. Mutation invalidates `['revision-cards']`, but the session query uses `['revision-session-cards', threshold]`, so data may stay stale across sessions.
- **6.5 Priority badge in revision mode**: Implemented via `RevisionBadge` over `SwipeableCard` at [src/routes/revision/session.tsx](src/routes/revision/session.tsx#L196-L208); severity colors follow spec. Preview badges also shown in [src/components/study/RevisionCardPreview.tsx](src/components/study/RevisionCardPreview.tsx#L1-L34).

## Gaps / Risks
- **Input shape mismatch**: `getRevisionCards` validator parses `{ threshold }`, but routes pass `{ data: { threshold } }`, likely leading to 400/validation errors. Align the input contract or adjust validator to parse `input.data`. Affects both config and session routes.
- **Cache invalidation mismatch**: After recording results, only `['revision-cards']` is invalidated, leaving `['revision-session-cards', threshold]` stale. Subsequent sessions may reuse old data until reload.
- **Minor accessibility**: Slider helper text not referenced via `aria-describedby`; `aria-valuenow/min/max` are redundant with native range input.

## Test & Lint
- Lint/tests not run in this pass. Biome warnings may still flag utility class names elsewhere; not rechecked here.

## Recommended Actions
1. Fix `getRevisionCards` input contract: either call with `{ threshold }` or adjust `inputValidator` to parse `data.threshold`.
2. Align revision query keys and invalidation (e.g., reuse `['revision-cards', threshold]` for session or invalidate the session key) to ensure fresh data after mutations.
3. Improve slider a11y: link helper text via `aria-describedby` and remove redundant aria attributes if unnecessary.
