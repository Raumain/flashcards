# 🐛 MedFlash Bug Report

**Report Date**: 2026-01-18  
**Analyzed By**: QA Agent  
**Status**: Active

---

## Summary

| Severity | Count |
|----------|-------|
| 🔴 Critical | 2 |
| 🟠 High | 5 |
| 🟡 Medium | 8 |
| 🟢 Low | 6 |

---

## 🔴 Critical Issues

### BUG-001: Missing `lang` Attribute on HTML Element

**Component**: [src/routes/__root.tsx](../src/routes/__root.tsx#L42)  
**Severity**: 🔴 Critical  
**Type**: Accessibility / SEO

**Description**:  
The `<html>` element is missing the required `lang` attribute. This is a WCAG 2.1 Level A violation and affects:
- Screen reader users (assistive technology cannot determine content language)
- SEO ranking (search engines use this for language detection)
- Browser language features (spell checking, translation)

**Current Code**:
```tsx
<html>
```

**Expected**:
```tsx
<html lang="en">
```

**Steps to Reproduce**:
1. Run accessibility audit (Lighthouse/axe)
2. Observe missing lang attribute warning

**Fix Priority**: Immediate

---

### BUG-002: External Dependency on `pdftoppm` Not Documented

**Component**: [src/lib/pdf-processor.ts](../src/lib/pdf-processor.ts#L72-L118)  
**Severity**: 🔴 Critical  
**Type**: Runtime / Deployment

**Description**:  
The PDF processor relies on `pdftoppm` (part of `poppler-utils`) which is a system-level binary not installed via npm. This will cause runtime failures in:
- Docker containers without poppler-utils
- Serverless environments (Vercel, Netlify)
- Windows development machines

**Current Code**:
```typescript
const proc = spawn("pdftoppm", args);
```

**Impact**:
- App will crash with `ENOENT` error when processing PDFs
- No fallback mechanism exists
- No documentation for required system dependencies

**Suggested Fix**:
1. Add `poppler-utils` to deployment documentation
2. Add runtime check for `pdftoppm` availability
3. Consider using `pdfjs-dist` as a pure-JS alternative
4. Add Dockerfile with required dependencies

---

## 🟠 High Severity Issues

### BUG-003: Test Path Aliases Not Resolving

**Component**: [tests/unit/*.test.ts](../tests/)  
**Severity**: 🟠 High  
**Type**: Test Infrastructure

**Description**:  
Multiple test files fail to compile because TypeScript path aliases (`~/`) are not resolving:
- `tests/unit/flashcard-types.test.ts`
- `tests/unit/error-parsing.test.ts`
- `tests/unit/loading-components.test.tsx`

**Error**:
```
Cannot find module '~/lib/types/flashcard' or its corresponding type declarations.
Cannot find module '~/components/ui/ErrorAlert' or its corresponding type declarations.
```

**Root Cause**:  
The `vitest.config.ts` defines the alias correctly, but `tsconfig.json` doesn't include the test directory:

```jsonc
// tsconfig.json
"include": ["src/**/*", "app.config.ts"]  // Missing: "tests/**/*"
```

**Fix**: Add `"tests/**/*"` to `include` array in `tsconfig.json`.

---

### BUG-004: Streaming Result Not Actually Streamed to UI

**Component**: [src/routes/index.tsx](../src/routes/index.tsx#L130-L140)  
**Severity**: 🟠 High  
**Type**: Feature / UX

**Description**:  
The UI shows a "streaming" progress but the actual implementation waits for the complete result before displaying flashcards. The `streamFlashcardsFromImages` function exists but its streaming capabilities are not utilized.

**Current Behavior**:
```typescript
// Awaits complete result
const result = await streamResult.object;
```

**Expected Behavior**:  
Flashcards should appear incrementally as they're generated, providing real-time feedback.

**Impact**: Users wait without seeing progress, poor UX for large PDFs.

---

### BUG-005: No Cancel Functionality for Server Request

**Component**: [src/routes/index.tsx](../src/routes/index.tsx#L170-L175)  
**Severity**: 🟠 High  
**Type**: Feature / UX

**Description**:  
The abort controller is created and can abort local state, but there's no actual cancellation of the server-side generation request. The PDF processing and AI generation continue running on the server even after user clicks "Cancel".

**Impact**:
- Wasted API credits
- Server resources consumed unnecessarily
- Potential rate limiting from unnecessary Gemini API calls

---

### BUG-006: Unhandled Promise Rejection in PDF Cleanup

**Component**: [src/lib/pdf-processor.ts](../src/lib/pdf-processor.ts#L205-L213)  
**Severity**: 🟠 High  
**Type**: Error Handling

**Description**:  
The cleanup in the `finally` block silently catches errors but never logs them. If temp files fail to clean up repeatedly, disk space could be exhausted.

**Current Code**:
```typescript
} catch {
  // Ignore cleanup errors
}
```

**Suggested Fix**: Add warning-level logging and implement periodic cleanup job.

---

### BUG-007: Memory Leak Potential with Large PDFs

**Component**: [src/lib/pdf-processor.ts](../src/lib/pdf-processor.ts#L185-L200)  
**Severity**: 🟠 High  
**Type**: Performance / Memory

**Description**:  
All PDF pages are loaded into memory as base64 strings simultaneously via `Promise.all`. For a 50-page PDF with high-resolution images, this could consume several GB of memory.

**Current Code**:
```typescript
const pages: PageImage[] = await Promise.all(
  pngFiles.map(async (pngPath, index) => {
    const base64 = await convertToOptimizedJpeg(pngPath, opts);
    // ...
  }),
);
```

**Suggested Fix**: Process pages in batches or stream them.

---

## 🟡 Medium Severity Issues

### BUG-008: Array Index Used as React Key

**Component**: [src/components/ui/Loading.tsx](../src/components/ui/Loading.tsx)  
**Severity**: 🟡 Medium  
**Type**: React Best Practices

**Description**:  
Multiple components use array index as React key, which can cause rendering issues with dynamic lists:
- Line 36: `SkeletonText`
- Line 98: `SkeletonFlashcardGrid`
- Line 305: `StepProgress`
- Line 350: `StepProgress` labels

**Impact**: Potential UI glitches when lists reorder.

**Fix**: Generate unique IDs or use stable identifiers.

---

### BUG-009: `role="status"` on Non-Interactive `<div>` Elements

**Component**: [src/components/ui/Loading.tsx](../src/components/ui/Loading.tsx)  
**Severity**: 🟡 Medium  
**Type**: Accessibility

**Description**:  
Biome warns that `role="status"` is being used on `<div>` elements which could be replaced with `<output>` elements for better semantic HTML.

**Affected Lines**: 17, 34, 49, 84, 114, 151, 217, 297

**Suggested Fix**: Use `<output>` element instead of `<div role="status">`.

---

### BUG-010: DifficultyButton `value` Prop Unused

**Component**: [src/components/flashcards/FlashcardGrid.tsx](../src/components/flashcards/FlashcardGrid.tsx#L163)  
**Severity**: 🟡 Medium  
**Type**: Dead Code

**Description**:  
The `DifficultyButton` component receives a `value` prop that is never used inside the component:

```typescript
const DifficultyButton = memo(function DifficultyButton({
  label,
  isActive,  // value is destructured but never used
  onClick,
  ...
}: DifficultyButtonProps) {
```

**Fix**: Remove unused `value` prop from interface and component calls.

---

### BUG-011: Duplicate `LoadingSpinner` Definition

**Component**: [src/components/ui/DownloadButton.tsx](../src/components/ui/DownloadButton.tsx#L232) & [src/components/ui/Loading.tsx](../src/components/ui/Loading.tsx#L151)  
**Severity**: 🟡 Medium  
**Type**: Code Duplication

**Description**:  
`LoadingSpinner` is defined locally in `DownloadButton.tsx` when it should import from `Loading.tsx`.

**Impact**: Inconsistent styling, increased bundle size, maintenance burden.

---

### BUG-012: No Input Sanitization for PDF Filename

**Component**: [src/server/functions/generate.ts](../src/server/functions/generate.ts#L105)  
**Severity**: 🟡 Medium  
**Type**: Security

**Description**:  
The PDF filename from user upload is not sanitized before being used in temp file paths. While the path is in a temp directory, malicious filenames could potentially cause issues.

**Suggested Fix**: Sanitize or ignore original filename entirely (use UUID).

---

### BUG-013: Missing Loading State During Dynamic Import

**Component**: [src/components/ui/DownloadButton.tsx](../src/components/ui/DownloadButton.tsx#L36-L47)  
**Severity**: 🟡 Medium  
**Type**: UX

**Description**:  
When downloading PDF, there's a delay during the dynamic import of `pdf-generator` with no visual feedback specifically for the import phase. The loading spinner only shows after the import starts.

**Suggested Fix**: Show loading state immediately on click before dynamic import.

---

### BUG-014: No File Size Validation Before Upload Starts

**Component**: [src/routes/index.tsx](../src/routes/index.tsx#L82)  
**Severity**: 🟡 Medium  
**Type**: UX / Validation

**Description**:  
File size is validated server-side, but the client starts the "upload simulation" before validation. Large files (>20MB) should be rejected immediately at the dropzone level before any upload UI starts.

**Note**: `PDFDropzone` validates, but the parent component doesn't check `validatePDFFile` before starting generation.

---

### BUG-015: Integration Test Mocks Don't Match Actual Schema

**Component**: [tests/integration/generation-flow.test.ts](../tests/integration/generation-flow.test.ts#L26-L40)  
**Severity**: 🟡 Medium  
**Type**: Test Quality

**Description**:  
Test mocks use different schema than actual implementation:

**Mock Schema**:
```typescript
{
  id: '1',
  question: 'What is the heart?',  // flat structure
  answer: 'A muscular organ...',
}
```

**Actual Schema**:
```typescript
{
  id: '1',
  front: { question: '...' },  // nested structure
  back: { answer: '...' },
}
```

**Impact**: Tests pass but don't catch schema mismatches.

---

## 🟢 Low Severity Issues

### BUG-016: Trailing Comma in Import Statement

**Component**: [tests/unit/error-parsing.test.ts](../tests/unit/error-parsing.test.ts#L5)  
**Severity**: 🟢 Low  
**Type**: Code Style

**Description**:  
Trailing comma in import destructuring:
```typescript
import { parseError, } from '~/components/ui/ErrorAlert'
```

---

### BUG-017: Console.error Suppression Too Broad in Tests

**Component**: [tests/setup.ts](../tests/setup.ts#L20-L31)  
**Severity**: 🟢 Low  
**Type**: Test Quality

**Description**:  
The test setup suppresses console.error for React error boundaries, but the pattern matching could hide legitimate errors.

---

### BUG-018: Missing Type Export in Lib Index

**Component**: [src/lib/index.ts](../src/lib/index.ts)  
**Severity**: 🟢 Low  
**Type**: Developer Experience

**Description**:  
`src/lib/index.ts` exports everything but the comment says "Type exports" which is misleading.

---

### BUG-019: generatePrintablePDF is Identical to generateFlashcardPDF

**Component**: [src/lib/pdf-generator.ts](../src/lib/pdf-generator.ts#L252-L260)  
**Severity**: 🟢 Low  
**Type**: Incomplete Feature

**Description**:  
The `generatePrintablePDF` function is supposed to optimize for double-sided printing but currently just calls `generateFlashcardPDF`:

```typescript
export async function generatePrintablePDF(...) {
  // For now, same as generateFlashcardPDF
  return generateFlashcardPDF(flashcards, config);
}
```

---

### BUG-020: Not Found Component Too Basic

**Component**: [src/routes/__root.tsx](../src/routes/__root.tsx#L29)  
**Severity**: 🟢 Low  
**Type**: UX

**Description**:  
The 404 component is a bare fragment with just text:
```tsx
notFoundComponent: () => <>Not found</>
```

Should include navigation back to home, proper styling, etc.

---

### BUG-021: Progress Simulation is Fixed Duration

**Component**: [src/routes/index.tsx](../src/routes/index.tsx#L91-L104)  
**Severity**: 🟢 Low  
**Type**: UX Accuracy

**Description**:  
Upload progress is simulated with fixed intervals regardless of actual file size or network speed:

```typescript
const progressInterval = setInterval(() => {
  setUploadProgress((prev) => prev + 10)
}, 100)
```

Real upload progress should be tracked or simulation should adapt to estimated processing time.

---

## Recommendations

### Immediate Actions (Week 1)
1. Fix `lang` attribute on `<html>` element
2. Document `poppler-utils` dependency or add fallback
3. Fix test path aliases in `tsconfig.json`

### Short-term (Week 2-3)
1. Implement actual streaming UI for flashcard generation
2. Add server-side cancellation support
3. Fix array key warnings
4. Remove duplicate `LoadingSpinner`

### Medium-term (Month 1)
1. Implement batch processing for large PDFs
2. Add proper cleanup logging
3. Implement real upload progress tracking
4. Improve 404 page
5. Implement actual print-optimized PDF layout

---

## Test Coverage Gaps

| Area | Coverage | Notes |
|------|----------|-------|
| PDF Processing | ❌ None | Needs mock for pdftoppm |
| Gemini Integration | ❌ None | Needs API mocking |
| Component Rendering | ✅ Partial | Loading components tested |
| Error Handling | ✅ Good | parseError well tested |
| Schema Validation | ✅ Good | Zod schemas tested |
| E2E Flow | ❌ None | No Playwright/Cypress tests |

---

*Report generated by QA Agent for MedFlash v0.1.0*
