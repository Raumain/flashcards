# 🔒 Security Review

**Report Date**: 2026-01-18  
**Analyzed By**: QA Agent  
**Risk Level**: Medium

---

## Summary

| Category | Issues | Risk |
|----------|--------|------|
| Input Validation | 2 | 🟡 Medium |
| API Security | 2 | 🟡 Medium |
| Client-Side | 1 | 🟢 Low |
| Dependency | 1 | 🟢 Low |

---

## 🟡 Medium Risk Issues

### SEC-001: Potential Path Traversal in Temp File Handling

**Component**: [src/lib/pdf-processor.ts](../src/lib/pdf-processor.ts#L175-L180)  
**Risk**: 🟡 Medium

**Issue**: While the temp directory uses a UUID, the cleanup logic reads directory contents without validating the paths:

```typescript
const files = await readdir(tempDir);
await Promise.all(files.map((f) => unlink(join(tempDir, f))));
```

If a symlink is placed in the temp directory, it could potentially delete files outside the temp directory.

**Mitigation**:
1. Use `lstat` to check file types before unlinking
2. Use `rm` with `{recursive: true, force: true}` on the entire temp directory
3. Consider using `os.tmpdir()` with restrictive permissions

---

### SEC-002: API Key Exposure in Environment

**Component**: [src/lib/gemini.ts](../src/lib/gemini.ts#L10)  
**Risk**: 🟡 Medium

**Issue**: The Gemini API key is accessed via `process.env.GOOGLE_GENERATIVE_AI_API_KEY` which is fine for server-side, but there's no protection against:
1. Accidental client-side exposure
2. Logging of the key in error messages

**Current Code**:
```typescript
const google = createGoogleGenerativeAI({
  apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY,
});
```

**Recommendations**:
1. Ensure the env var is server-only (not prefixed with `VITE_`)
2. Never log the API key in error handlers
3. Add runtime validation that key exists on server init
4. Consider using a secrets manager for production

---

### SEC-003: No Rate Limiting on Server Function

**Component**: [src/server/functions/generate.ts](../src/server/functions/generate.ts)  
**Risk**: 🟡 Medium

**Issue**: The `generateFlashcards` server function has no rate limiting. A malicious user could:
1. Exhaust Gemini API quota rapidly
2. Cause denial of service via PDF processing load
3. Incur unexpected API costs

**Recommendations**:
1. Implement per-IP rate limiting
2. Add request queuing for concurrent requests
3. Set maximum requests per session/time window

```typescript
// Example with upstash/ratelimit
import { Ratelimit } from "@upstash/ratelimit";

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(10, "1 m"),
});
```

---

### SEC-004: No Input Size Validation for Base64 Images

**Component**: [src/lib/gemini.ts](../src/lib/gemini.ts#L56)  
**Risk**: 🟡 Medium

**Issue**: Images are passed to Gemini as base64 strings with no total size validation. A 50-page PDF with high-resolution images could result in:
1. Memory exhaustion
2. Request timeout
3. Extremely large API request bodies

**Recommendation**: Add total payload size check before API call:
```typescript
const totalSize = images.reduce((sum, img) => sum + img.base64.length, 0);
const MAX_PAYLOAD_SIZE = 50 * 1024 * 1024; // 50MB

if (totalSize > MAX_PAYLOAD_SIZE) {
  throw new GeminiError("GENERATION_FAILED", "Total image size too large");
}
```

---

## 🟢 Low Risk Issues

### SEC-005: Client-Side File Type Validation Only

**Component**: [src/components/upload/PDFDropzone.tsx](../src/components/upload/PDFDropzone.tsx#L35-L47)  
**Risk**: 🟢 Low (mitigated by server validation)

**Issue**: File type validation is performed client-side based on MIME type, which can be spoofed.

**Mitigation Already In Place**:
- Server validates PDF magic bytes in `pdf-processor.ts`
- Server validates file type in `generate.ts`

**Recommendation**: Add magic byte validation on client for faster feedback:
```typescript
function isPDF(file: File): Promise<boolean> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const arr = new Uint8Array(e.target?.result as ArrayBuffer);
      const header = Array.from(arr.slice(0, 5));
      resolve(header.join(',') === '37,80,68,70,45'); // %PDF-
    };
    reader.readAsArrayBuffer(file.slice(0, 5));
  });
}
```

---

### SEC-006: Dependencies with Known Vulnerabilities

**Component**: `package.json`  
**Risk**: 🟢 Low

**Issue**: Without running `npm audit`, it's impossible to know if dependencies have vulnerabilities.

**Recommendation**:
1. Run `bun audit` or `npm audit` regularly
2. Set up Dependabot or Renovate for automated updates
3. Pin dependency versions in production

---

## Security Best Practices Implemented ✅

| Practice | Status | Location |
|----------|--------|----------|
| Server-side validation | ✅ | `generate.ts` |
| PDF magic byte check | ✅ | `pdf-processor.ts` |
| File size limits | ✅ | Client + Server |
| No `dangerouslySetInnerHTML` | ✅ | All components |
| Typed schemas (Zod) | ✅ | Type validation |
| Environment variable for API key | ✅ | Server-only |
| HTTPS for API calls | ✅ | Gemini SDK |

---

## OWASP Top 10 Assessment

| Category | Status | Notes |
|----------|--------|-------|
| A01: Broken Access Control | ⚠️ | No auth implemented |
| A02: Cryptographic Failures | ✅ | N/A for this app |
| A03: Injection | ✅ | Zod validation |
| A04: Insecure Design | ⚠️ | No rate limiting |
| A05: Security Misconfiguration | ✅ | Env vars configured |
| A06: Vulnerable Components | ❓ | Needs audit |
| A07: Auth Failures | N/A | No auth yet |
| A08: Data Integrity Failures | ✅ | Validated schemas |
| A09: Security Logging | ❌ | No security logs |
| A10: SSRF | ⚠️ | PDF from user |

---

## Recommendations Priority

| Priority | Issue | Effort | Impact |
|----------|-------|--------|--------|
| P1 | Add rate limiting | 2-4 hours | High |
| P1 | Validate payload size | 30 min | Medium |
| P2 | Security logging | 2-4 hours | Medium |
| P2 | Dependency audit | 1 hour | Variable |
| P3 | Client magic byte check | 1 hour | Low |

---

## Future Considerations

### If Adding User Authentication

1. Implement CSRF protection
2. Use secure session management
3. Add auth middleware to server functions
4. Implement proper logout/token revocation

### If Storing User Data

1. Implement data encryption at rest
2. Define data retention policies
3. Add GDPR compliance measures
4. Implement access logging

---

*Security Review by QA Agent for MedFlash v0.1.0*
