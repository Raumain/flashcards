# ⚡ Performance Analysis

**Report Date**: 2026-01-18  
**Analyzed By**: QA Agent

---

## Summary

| Area | Status | Notes |
|------|--------|-------|
| Bundle Size | ⚠️ | PDF libs need lazy loading (implemented) |
| Runtime | ⚠️ | Memory concerns for large PDFs |
| Rendering | ✅ | Proper memoization |
| Network | ✅ | Preconnect configured |

---

## Bundle Analysis

### Main Bundle Dependencies

| Package | Size (approx.) | Loaded | Notes |
|---------|---------------|--------|-------|
| React + ReactDOM | ~45KB | Immediate | Core |
| TanStack Router | ~30KB | Immediate | Routing |
| Tailwind CSS | Variable | Immediate | Styles |
| jsPDF | ~280KB | Lazy ✅ | PDF generation |
| pdf-lib | ~280KB | Server only | PDF parsing |
| Zod | ~50KB | Immediate | Validation |
| AI SDK | ~15KB | Immediate | Gemini client |

### Lazy Loading Implementation ✅

The `DownloadButton` correctly lazy loads PDF generation:

```typescript
async function loadPDFGenerator(format: PDFFormat) {
  const pdfModule = await import('~/lib/pdf-generator')
  // ...
}
```

**Benefit**: ~280KB saved from initial bundle.

---

## Memory Analysis

### 🔴 Issue: Large PDF Memory Consumption

**Component**: [src/lib/pdf-processor.ts](../src/lib/pdf-processor.ts#L185-L200)

**Current Behavior**:
```typescript
const pages: PageImage[] = await Promise.all(
  pngFiles.map(async (pngPath, index) => {
    const base64 = await convertToOptimizedJpeg(pngPath, opts);
    return { page: index + 1, base64, mimeType: "image/jpeg" };
  }),
);
```

**Problem**: All pages loaded into memory simultaneously.

**Memory Calculation**:
- 50 pages × 1024px width × 768px height × 3 bytes (RGB) = ~118MB raw
- After JPEG compression (~80%): ~24MB as base64 strings
- Plus overhead: ~30-50MB total memory spike

**Recommendation**: Process in batches:
```typescript
const BATCH_SIZE = 10;
const pages: PageImage[] = [];

for (let i = 0; i < pngFiles.length; i += BATCH_SIZE) {
  const batch = pngFiles.slice(i, i + BATCH_SIZE);
  const batchResults = await Promise.all(
    batch.map(async (pngPath, idx) => ({
      page: i + idx + 1,
      base64: await convertToOptimizedJpeg(pngPath, opts),
      mimeType: "image/jpeg" as const,
    }))
  );
  pages.push(...batchResults);
}
```

---

## Rendering Performance

### ✅ Proper Memoization

| Component | Memoization | Notes |
|-----------|-------------|-------|
| `FlashcardGrid` | `memo()` | ✅ Prevents re-renders |
| `FlashcardItem` | `memo()` | ✅ Prevents re-renders |
| `PDFDropzone` | `memo()` | ✅ Prevents re-renders |
| `DifficultyButton` | `memo()` | ✅ Prevents re-renders |

### ✅ Proper Use of useCallback

Callbacks are properly memoized in `FlashcardGrid`:
```typescript
const handleCategoryChange = useCallback((e) => {
  setCategoryFilter(e.target.value)
}, [])
```

### ✅ Proper Use of useMemo

Filtered results are correctly memoized:
```typescript
const filteredFlashcards = useMemo(() => {
  return flashcards.filter(...)
}, [flashcards, categoryFilter, difficultyFilter])
```

---

## Network Performance

### ✅ Preconnect Configuration

Root layout includes preconnect for faster API calls:
```tsx
links: [
  { rel: 'preconnect', href: 'https://generativelanguage.googleapis.com' },
  { rel: 'dns-prefetch', href: 'https://generativelanguage.googleapis.com' },
]
```

### ⚠️ No Request Deduplication

If user rapidly clicks or triggers generation, multiple requests could be sent. Consider:
- Debouncing file selection
- Request queue management
- AbortController for cancellation (partially implemented)

---

## Lighthouse Targets

| Metric | Target | Current (est.) | Status |
|--------|--------|----------------|--------|
| FCP | < 1.5s | ~1.2s | ✅ |
| LCP | < 2.5s | ~2.0s | ✅ |
| TBT | < 200ms | ~150ms | ✅ |
| CLS | < 0.1 | ~0.05 | ✅ |
| Speed Index | < 3.0s | ~2.5s | ✅ |

*Note: These are estimates based on code analysis. Real metrics require testing.*

---

## Recommendations

### P1: High Priority

1. **Batch PDF Processing**
   - Process pages in groups of 10
   - Reduces memory spikes
   - Effort: 1-2 hours

2. **Add Request Debouncing**
   - Prevent rapid re-submissions
   - Effort: 30 min

### P2: Medium Priority

3. **Image Optimization Pipeline**
   - Consider WebP for smaller base64 strings
   - Adjust quality based on content type
   - Effort: 2-4 hours

4. **Virtual Scrolling for Large Result Sets**
   - If 100+ flashcards, use virtualization
   - Libraries: `@tanstack/react-virtual`
   - Effort: 2-4 hours

### P3: Low Priority

5. **Service Worker for Caching**
   - Cache static assets
   - Offline-first for returning users
   - Effort: 4-8 hours

6. **Image Placeholder Optimization**
   - Use blur placeholder during load
   - Effort: 1-2 hours

---

## Build Optimization Status

### Vite Configuration ✅

```typescript
build: {
  minify: 'esbuild',      // ✅ Fast minification
  target: 'es2022',       // ✅ Modern browsers
  sourcemap: false,       // ✅ No production sourcemaps
  chunkSizeWarningLimit: 600, // ✅ Appropriate for lazy-loaded chunks
}
```

### Dependency Optimization ✅

```typescript
optimizeDeps: {
  include: ['react', 'react-dom', '@tanstack/react-router'],
}
```

---

## Monitoring Recommendations

### Metrics to Track

1. **Core Web Vitals**
   - LCP, FID, CLS
   - Use Vercel Analytics or Sentry

2. **Custom Metrics**
   - PDF processing time
   - Flashcard generation time
   - API response times

3. **Error Rates**
   - PDF processing failures
   - Gemini API errors
   - Client-side errors

### Example Implementation

```typescript
// Track generation time
const startTime = performance.now();
const result = await generateFlashcards(formData);
const duration = performance.now() - startTime;

// Send to analytics
analytics.track('generation_complete', {
  duration,
  cardCount: result.flashcards.length,
  pageCount: pdfPageCount,
});
```

---

*Performance Analysis by QA Agent for MedFlash v0.1.0*
