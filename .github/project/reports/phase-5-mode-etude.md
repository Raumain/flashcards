# Phase 5 – Mode Étude Review (2026-01-25)

## Status by Task
- **5.1 Route /study sélection thématiques**: Implemented at [src/routes/study/index.tsx](src/routes/study/index.tsx#L1-L120). Loads thematics, shows selection, disables start when empty. Uses TopicSelector internally (selection state inside component, not lifted).
- **5.2 TopicSelector**: Implemented at [src/components/study/TopicSelector.tsx](src/components/study/TopicSelector.tsx#L1-L200) with select/deselect all, counts, visual states. Props differ from spec: maintains internal `selected` state and no `selected`/`onSelectionChange` props; cannot be controlled by parent.
- **5.3 SwipeableCard**: Implemented at [src/components/study/SwipeableCard.tsx](src/components/study/SwipeableCard.tsx#L1-L240) with framer-motion drag, flip, left/right indicators, and swipe callbacks. Uses schema Flashcard type from DB; missing keyboard swipe shortcuts but core swipe behavior is present. Uses `bg-gradient-to-br` class (Biome flag elsewhere) and non-spec class name for gradient.
- **5.4 Route /study/session**: Implemented at [src/routes/study/session.tsx](src/routes/study/session.tsx#L1-L230): loads flashcards for selected thematics, shuffles, records results, shows progress, complete screen. Accepts `thematics` search param and passes to server. No keyboard shortcuts; otherwise matches flow.
- **5.5 recordStudyResult**: Implemented in [src/server/functions/study.ts](src/server/functions/study.ts#L46-L86) with validation and DB insert; used in session with optimistic advance.
- **5.6 StudyProgress**: Implemented at [src/components/study/StudyProgress.tsx](src/components/study/StudyProgress.tsx#L1-L80). Displays card count, counts correct/wrong, progress bar updates.
- **5.7 StudyComplete**: Implemented at [src/components/study/StudyComplete.tsx](src/components/study/StudyComplete.tsx#L1-L120) with stats, encouragement, actions, and list of wrong cards.

## Gaps / Risks
- **TopicSelector API mismatch**: Not controllable by parent; diverges from spec props, reducing reusability and testability.
- **Accessibility/consistency**: Uses `flex-shrink-0` (Biome flag) and gradient class `bg-gradient-to-br` flagged by Biome. Keyboard swipe alternatives absent.
- **Minor UX gaps**: No keyboard shortcuts for swipe; study entry points in dashboard remain disabled (from Phase 4), limiting discoverability.

## Test & Lint
- Lint/tests not run in this pass; Biome already flagged `flex-shrink-0`/`bg-gradient-to-br` elsewhere.

## Recommended Actions
1. Refactor TopicSelector to accept `selected` and `onSelectionChange` props per spec; lift state to /study route for control and testability.
2. Address Biome class warnings (`shrink-0`, `bg-linear-to-br`) and ensure globals.css contains required 3D classes (already present).
3. Consider adding keyboard shortcuts (left/right arrows) in session for accessibility.
4. Add discoverable entry to start study from dashboard pages once Phase 4 nav is fixed.
