# 🧪 Test Coverage Analysis

**Report Date**: 2026-01-18  
**Analyzed By**: QA Agent

---

## Current Test Inventory

| File | Type | Tests | Status |
|------|------|-------|--------|
| `tests/unit/flashcard-types.test.ts` | Unit | 5 | ❌ Broken |
| `tests/unit/error-parsing.test.ts` | Unit | 10 | ❌ Broken |
| `tests/unit/loading-components.test.tsx` | Unit | 12 | ❌ Broken |
| `tests/integration/generation-flow.test.ts` | Integration | 9 | ⚠️ Schema mismatch |

**Total Tests**: 36  
**Passing**: 0 (due to path alias issues)  
**Broken**: 36

---

## Root Cause: Path Alias Resolution

All tests are broken due to TypeScript path aliases not resolving in the test environment.

### Fix Required

**File**: `tsconfig.json`

```diff
{
  "compilerOptions": { ... },
- "include": ["src/**/*", "app.config.ts"],
+ "include": ["src/**/*", "app.config.ts", "tests/**/*"],
  "exclude": ["node_modules", ".vinxi", ".output"]
}
```

---

## Coverage Gaps

### ❌ No Tests Exist For

| Component/Module | Priority | Complexity |
|------------------|----------|------------|
| `PDFDropzone` | High | Medium |
| `FlashcardGrid` | High | Low |
| `FlashcardItem` | High | Low |
| `GenerationProgress` | Medium | Low |
| `DownloadButton` | Medium | Medium |
| `ErrorAlert` (component) | Medium | Low |
| `pdf-processor.ts` | High | High |
| `gemini.ts` | High | High |
| `pdf-generator.ts` | Medium | Medium |
| `generate.ts` (server fn) | High | High |
| `index.tsx` (main page) | High | High |

### ⚠️ Partial Coverage

| Area | What's Tested | What's Missing |
|------|---------------|----------------|
| `parseError` utility | All error types | Error edge cases |
| `FlashcardSchema` | Valid/invalid data | Boundary values |
| Loading components | Rendering | User interactions |

---

## Recommended Test Plan

### Phase 1: Fix Infrastructure (Immediate)

1. Fix `tsconfig.json` include path
2. Verify all existing tests pass
3. Add test script to CI/CD

### Phase 2: Unit Tests (Week 1)

#### 2.1 Component Tests

```typescript
// tests/unit/PDFDropzone.test.tsx
describe('PDFDropzone', () => {
  it('should accept valid PDF files')
  it('should reject non-PDF files')
  it('should reject files over size limit')
  it('should show drag-over state')
  it('should show upload progress')
  it('should be keyboard accessible')
})

// tests/unit/FlashcardItem.test.tsx
describe('FlashcardItem', () => {
  it('should render question on front')
  it('should flip on click')
  it('should flip on Enter/Space key')
  it('should show difficulty badge')
  it('should show category')
  it('should call onFlip callback')
})

// tests/unit/FlashcardGrid.test.tsx
describe('FlashcardGrid', () => {
  it('should render all flashcards')
  it('should filter by category')
  it('should filter by difficulty')
  it('should show empty state')
  it('should clear filters')
})
```

#### 2.2 Library Tests

```typescript
// tests/unit/pdf-processor.test.ts
describe('PDF Processor', () => {
  it('should validate PDF magic bytes')
  it('should reject empty buffers')
  it('should reject non-PDF files')
  it('should respect maxPages option')
  it('should clean up temp files')
  // Note: Requires mocking pdftoppm
})

// tests/unit/pdf-generator.test.ts
describe('PDF Generator', () => {
  it('should create valid PDF blob')
  it('should include all flashcards')
  it('should draw front and back pages')
  it('should handle different formats')
})
```

### Phase 3: Integration Tests (Week 2)

```typescript
// tests/integration/upload-flow.test.ts
describe('Upload Flow', () => {
  it('should complete upload → generate → display cycle')
  it('should handle API errors gracefully')
  it('should allow cancellation')
  it('should allow retry after error')
})
```

### Phase 4: E2E Tests (Week 3)

Set up Playwright for end-to-end testing:

```typescript
// tests/e2e/flashcard-generation.spec.ts
test('user can generate flashcards from PDF', async ({ page }) => {
  await page.goto('/')
  await page.setInputFiles('[data-testid="pdf-input"]', 'test.pdf')
  await expect(page.getByText('Generating')).toBeVisible()
  await expect(page.getByText('Generated Flashcards')).toBeVisible({ timeout: 60000 })
})
```

---

## Mocking Strategy

### External Dependencies

| Dependency | Mock Strategy |
|------------|---------------|
| `pdftoppm` | Mock `spawn` to return pre-generated PNGs |
| Gemini API | Mock `@ai-sdk/google` with fixture responses |
| File System | Use `memfs` or mock `fs/promises` |

### Example: Gemini API Mock

```typescript
// tests/mocks/gemini.ts
import { vi } from 'vitest'

export const mockGeminiResponse = {
  flashcards: [
    {
      id: 'test-1',
      front: { question: 'What is the heart?' },
      back: { answer: 'A muscular organ...' },
      category: 'Anatomy',
      difficulty: 'easy',
    },
  ],
  metadata: {
    subject: 'Cardiology',
    totalConcepts: 1,
  },
}

vi.mock('@ai-sdk/google', () => ({
  createGoogleGenerativeAI: () => () => ({
    // Mock model implementation
  }),
}))
```

---

## Test Data Fixtures

### Sample Flashcard Data

```typescript
// tests/fixtures/flashcards.ts
export const sampleFlashcard = {
  id: 'card-001',
  front: {
    question: 'What are the four chambers of the heart?',
    imageDescription: 'Diagram showing heart anatomy',
  },
  back: {
    answer: 'Left atrium, right atrium, left ventricle, right ventricle',
    details: 'The atria receive blood, ventricles pump blood out.',
  },
  category: 'Cardiology',
  difficulty: 'medium' as const,
}

export const sampleGenerationResult = {
  flashcards: [sampleFlashcard],
  metadata: {
    subject: 'Cardiology',
    totalConcepts: 5,
    recommendations: 'Focus on blood flow direction',
  },
}
```

---

## Quality Gates

### Pre-commit Checks

```bash
# package.json scripts
"test:pre-commit": "vitest run --changed"
"test:full": "vitest run --coverage"
```

### CI Pipeline Checks

- [ ] All tests pass
- [ ] Coverage > 70%
- [ ] No type errors
- [ ] Biome lint passes

---

## Coverage Targets

| Metric | Current | Target |
|--------|---------|--------|
| Statements | 0% | 70% |
| Branches | 0% | 65% |
| Functions | 0% | 75% |
| Lines | 0% | 70% |

---

*Analysis by QA Agent for MedFlash v0.1.0*
