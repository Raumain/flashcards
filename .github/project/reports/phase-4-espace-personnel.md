# Phase 4 – Espace Personnel Review (2026-01-25)

## Status by Task
- **4.1 Layout Dashboard (Navbar, Sidebar)**: Partially implemented. Navbar exists with links to Dashboard/Flashcards/Settings; Sidebar exists with dashboard/flashcards/study/revision/settings items and active styling. Missing: study/revision links are disabled placeholders; sidebar is not integrated into the dashboard layout (layout uses only Navbar + MobileNav in [src/routes/dashboard.tsx](src/routes/dashboard.tsx#L1-L20)). No hamburger/toggle for sidebar; mobile behavior is limited to MobileNav tabs, not a collapsible sidebar.
- **4.2 Route /dashboard**: Implemented at [src/routes/dashboard/index.tsx](src/routes/dashboard/index.tsx#L1-L200) with metrics, recent thematics, and quick actions. Layout lacks the required sidebar container; actions present but only two (no “commencer une session” button).
- **4.3 Composant ThematicCard**: Implemented at [src/components/flashcards/ThematicCard.tsx](src/components/flashcards/ThematicCard.tsx#L1-L200) with delete support and compact button variant.
- **4.4 Route /dashboard/flashcards**: Implemented at [src/routes/dashboard/flashcards.tsx](src/routes/dashboard/flashcards.tsx#L1-L250). Grid, empty state, selection by thematic, and disabled study button. Deletion is available only in detail modal (see 4.5), not from the grid; confirmation handled there.
- **4.5 Route /dashboard/flashcards/:id**: Implemented at [src/routes/dashboard/flashcards/$thematicId.tsx](src/routes/dashboard/flashcards/%24thematicId.tsx#L1-L260) with detail header, flashcards list, delete flashcard/thematic with confirmation modal. Actions “Étudier” disabled; no download action.
- **4.6 FlashcardGrid amélioré**: Not aligned with spec. Current [FlashcardGrid](src/components/flashcards/FlashcardGrid.tsx#L1-L200) supports category/difficulty filters but no pagination, no sorting, no multi-select, no bulk actions. Props differ from the spec (uses onDeleteFlashcard/onFlashcardFlip rather than selectable/onSelect/onDelete).
- **4.7 Suppression avec confirmation**: Present for flashcards/thematics within the detail view (modal in [$thematicId.tsx](src/routes/dashboard/flashcards/%24thematicId.tsx#L150-L240)); ThematicCard has its own confirmation overlay; grid list page lacks delete entry points. Success toasts not implemented; relies on query invalidation.

## Gaps / Risks
- Missing layout integration: sidebar not used in dashboard pages; study/revision nav disabled; no mobile hamburger.
- FlashcardGrid missing pagination/sort/select per requirements.
- Study/Revision navigation links inactive; actions to start sessions absent/disabled in dashboard and detail pages.
- Download action absent on thematic detail.

## Test & Lint
- Lint/tests not run in this pass; prior Biome issues remain unresolved.

## Recommended Actions
1. Wrap dashboard routes with a layout that includes Sidebar (desktop) and a mobile toggle; enable nav links for study/revision when those modes are ready.
2. Extend FlashcardGrid to add pagination (page size 20), sorting (date/difficulty), selectable rows with onSelect/onDelete callbacks matching the spec.
3. Add delete entry points on the flashcards list grid (with confirmation + success toast) and optionally in ThematicCard list view.
4. Add actions on thematic detail: start study (navigates to /study with preselected thematic) and download PDF if available.
5. Add a “commencer une session” quick action on /dashboard per spec.
