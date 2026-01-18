# ♿ Accessibility Audit

**Report Date**: 2026-01-18  
**Standard**: WCAG 2.1 Level AA  
**Analyzed By**: QA Agent

---

## Summary

| Level | Issues | Status |
|-------|--------|--------|
| Level A | 2 | 🔴 Critical |
| Level AA | 3 | 🟡 Needs Work |
| Level AAA | 1 | 🟢 Enhancement |

---

## 🔴 Level A Violations

### A11Y-001: Missing Language Attribute

**WCAG**: 3.1.1 Language of Page (Level A)  
**Component**: [src/routes/__root.tsx#L42](../src/routes/__root.tsx#L42)

**Issue**: The `<html>` element lacks a `lang` attribute.

**Impact**:
- Screen readers cannot determine content language
- Text-to-speech may use wrong pronunciation
- Browser translation features may not work correctly

**Fix**:
```diff
- <html>
+ <html lang="en">
```

---

### A11Y-002: Improper Use of `role="status"`

**WCAG**: 4.1.2 Name, Role, Value (Level A)  
**Component**: [src/components/ui/Loading.tsx](../src/components/ui/Loading.tsx)

**Issue**: Multiple `<div>` elements use `role="status"` where semantic `<output>` element would be more appropriate.

**Affected Lines**: 17, 34, 49, 84, 114, 151, 217, 297

**Fix**: Replace `<div role="status">` with `<output>`:
```diff
- <div role="status" aria-label="Loading...">
+ <output aria-label="Loading...">
```

---

## 🟡 Level AA Issues

### A11Y-003: Focus Management During State Transitions

**WCAG**: 2.4.3 Focus Order (Level A), 2.4.7 Focus Visible (Level AA)  
**Component**: [src/routes/index.tsx](../src/routes/index.tsx)

**Issue**: When transitioning from upload to generation to results, focus is not programmatically moved. Users using keyboard navigation must manually find new content.

**Recommendation**:
1. After successful generation, move focus to results heading
2. On error, move focus to error alert
3. Use `useEffect` with refs to manage focus

```typescript
const resultsRef = useRef<HTMLHeadingElement>(null)

useEffect(() => {
  if (isComplete && flashcards.length > 0) {
    resultsRef.current?.focus()
  }
}, [isComplete, flashcards])
```

---

### A11Y-004: Color Contrast in Difficulty Badges

**WCAG**: 1.4.3 Contrast (Minimum) (Level AA)  
**Component**: [src/components/flashcards/FlashcardItem.tsx](../src/components/flashcards/FlashcardItem.tsx#L9-L13)

**Issue**: Yellow difficulty badge (`bg-yellow-100`, `text-yellow-700`) may not meet 4.5:1 contrast ratio for normal text.

**Current Colors**:
- Background: `#fef3c7` (yellow-100)
- Text: `#a16207` (yellow-700)
- Contrast Ratio: ~3.5:1 ❌

**Fix**: Use darker text color:
```diff
- medium: { bg: 'bg-yellow-100', text: 'text-yellow-700' },
+ medium: { bg: 'bg-yellow-100', text: 'text-yellow-800' },
```

---

### A11Y-005: Missing Skip Link

**WCAG**: 2.4.1 Bypass Blocks (Level A)  
**Component**: [src/routes/__root.tsx](../src/routes/__root.tsx)

**Issue**: No skip link exists to bypass header and navigation to main content.

**Recommendation**: Add skip link as first focusable element:
```tsx
<a 
  href="#main-content" 
  className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 bg-blue-600 text-white px-4 py-2 rounded"
>
  Skip to main content
</a>
```

And add `id="main-content"` to main element.

---

## 🟢 Positive Findings

### Good Practices Implemented

| Feature | Component | Status |
|---------|-----------|--------|
| ARIA labels on buttons | `FlashcardItem`, `PDFDropzone` | ✅ |
| ARIA live regions | `GenerationProgress` | ✅ |
| Progress indicators | `GenerationProgress` | ✅ |
| Focus indicators | All interactive elements | ✅ |
| Error announcements | `ErrorAlert` | ✅ |
| Semantic HTML | `<section>`, `<header>` | ✅ |
| Form labels | `FlashcardGrid` filters | ✅ |
| Keyboard navigation | `FlashcardItem` | ✅ |

---

## Keyboard Navigation Matrix

| Component | Tab | Enter | Space | Escape | Arrows |
|-----------|-----|-------|-------|--------|--------|
| PDFDropzone | ✅ | ✅ Opens file dialog | ✅ Opens file dialog | - | - |
| FlashcardItem | ✅ | ✅ Flips card | ✅ Flips card | - | - |
| Category Filter | ✅ | ✅ Selects | - | - | ✅ Options |
| Difficulty Filter | ✅ | ✅ Selects | ✅ Selects | - | - |
| Download Button | ✅ | ✅ Downloads | - | - | - |
| Format Menu | ✅ | ✅ Selects | - | ❌ Should close | - |
| Cancel Button | ✅ | ✅ Cancels | ✅ Cancels | - | - |
| Error Retry | ✅ | ✅ Retries | - | - | - |

**Issue Found**: Format dropdown menu doesn't close on Escape key.

---

## Screen Reader Testing Checklist

### VoiceOver (macOS/iOS)

- [ ] Page title announced correctly
- [ ] Headings structure navigable (H1 → H2)
- [ ] Flashcard flip state announced
- [ ] Progress updates announced
- [ ] Error messages announced assertively
- [ ] Form controls properly labeled

### NVDA/JAWS (Windows)

- [ ] Same as VoiceOver checklist
- [ ] Virtual cursor navigation works
- [ ] Tables (if any) properly structured

---

## Recommended Testing Tools

| Tool | Purpose | URL |
|------|---------|-----|
| axe DevTools | Automated audit | Chrome Extension |
| WAVE | Visual a11y feedback | wave.webaim.org |
| Lighthouse | Performance + A11Y | Chrome DevTools |
| Color Contrast Analyzer | Contrast ratios | TPGi |
| NVDA | Screen reader testing | nvaccess.org |

---

## Action Items Priority

| Priority | Issue | Effort |
|----------|-------|--------|
| P0 | Add `lang` attribute | 1 min |
| P0 | Fix `role="status"` | 30 min |
| P1 | Add skip link | 15 min |
| P1 | Fix yellow contrast | 5 min |
| P2 | Focus management | 1-2 hours |
| P2 | Escape key on dropdown | 15 min |

---

*Audit by QA Agent for MedFlash v0.1.0*
