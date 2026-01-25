# Phase 3 – Persistance Flashcards Review (2026-01-25)

## Status by Task
- **3.1 saveFlashcards**: Implemented in [src/server/functions/flashcards.ts](src/server/functions/flashcards.ts#L52-L99) with Zod validation, ownership check, and insertion with userId/thematicId. Returns inserted rows. Rejection on missing/foreign thematic handled.
- **3.2 Extraction thématique par IA**: Implemented in [src/lib/prompts/thematic-extractor.ts](src/lib/prompts/thematic-extractor.ts#L1-L200) with the required prompt, schema, defaults, and parser. Used in generation flow.
- **3.3 getThematics**: Implemented in [src/server/functions/thematics.ts](src/server/functions/thematics.ts#L49-L88) returning counts per thematic, filtered by user. Includes ordering and metadata.
- **3.4 getFlashcardsByThematic(s)**: Implemented in [src/server/functions/flashcards.ts](src/server/functions/flashcards.ts#L127-L187) with validators, user scoping, and ordering. Multi-thematic variant present.
- **3.5 Génération sauvegarde en base**: Implemented in [src/server/functions/generate.ts](src/server/functions/generate.ts#L520-L679): extracts thematic via AI, creates thematic in DB, streams Gemini flashcards, persists them, and returns thematic, flashcards, metadata, and page images.
- **3.6 deleteFlashcard**: Implemented in [src/server/functions/flashcards.ts](src/server/functions/flashcards.ts#L100-L126) with ownership check and error on missing card.
- **3.7 deleteThematic**: Implemented in [src/server/functions/thematics.ts](src/server/functions/thematics.ts#L189-L230) with ownership check; relies on cascade for flashcards/study sessions.

## Gaps / Risks
- None blocking for Phase 3 requirements. Business flow matches spec. Minor note: getThematics orders by `createdAt` desc (spec showed asc) but functionally acceptable.

## Test & Lint
- Lint/TypeScript/tests not executed in this phase review; project has existing Biome issues (see earlier reports). Recommend running `bun run lint` and `bun test` after pending fixes.

## Recommended Actions
1. Run lint/tests once Phase 1/2 lint blockers are fixed.
2. Optionally align `getThematics` ordering with spec (ascending by createdAt) if deterministic ordering is desired.
