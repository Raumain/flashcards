# 📐 MedFlash - System Blueprint

## Overview

**MedFlash** is a single-page web application that allows medical students to:
1. Upload a PDF of their course materials
2. Have AI (Gemini) analyze the content including text, images, and schemas
3. Generate study flashcards with relevant visuals
4. Download the flashcards as a PDF

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         CLIENT (Browser)                        │
├─────────────────────────────────────────────────────────────────┤
│  TanStack Start (SSR) + TanStack Router                         │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐  │
│  │ Upload Zone │→ │  Progress   │→ │  Flashcard Preview +    │  │
│  │   (PDF)     │  │  Indicator  │  │  Download Button        │  │
│  └─────────────┘  └─────────────┘  └─────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      SERVER (TanStack Start)                    │
├─────────────────────────────────────────────────────────────────┤
│  Server Functions (RPC)                                         │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │  POST /api/generate-flashcards                              ││
│  │  - Receive PDF as FormData                                  ││
│  │  - Extract pages as images (pdf-lib + sharp)                ││
│  │  - Send to Gemini Vision API                                ││
│  │  - Stream flashcard generation                              ││
│  │  - Return structured JSON                                   ││
│  └─────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                     GEMINI API (External)                       │
├─────────────────────────────────────────────────────────────────┤
│  gemini-2.0-flash                                               │
│  - Multimodal input (text + images)                             │
│  - Structured output (JSON flashcards)                          │
│  - Medical content understanding                                │
└─────────────────────────────────────────────────────────────────┘
```

## Tech Stack

| Layer | Technology | Purpose |
|-------|------------|---------|
| Framework | TanStack Start | Full-stack React with SSR |
| Routing | TanStack Router | Type-safe file-based routing |
| AI Integration | @tanstack/react-ai + @ai-sdk/google | Streaming AI responses |
| PDF Processing | pdf-lib, pdf2pic, sharp | PDF to images conversion |
| PDF Generation | jsPDF | Generate downloadable flashcard PDF |
| Styling | Tailwind CSS v4 | Utility-first styling |
| Runtime | Bun | Fast JavaScript runtime |

## Data Flow

### 1. PDF Upload
```
User drops PDF → FileReader → FormData → Server Function
```

### 2. PDF Processing (Server)
```
PDF Buffer → pdf2pic → PNG images per page → Base64 encoding
```

### 3. AI Generation
```
Images + System Prompt → Gemini Vision → Structured Flashcards JSON
```

### 4. Flashcard Schema
```typescript
interface Flashcard {
  id: string;
  front: {
    question: string;
    image?: string; // Base64 if relevant image from PDF
  };
  back: {
    answer: string;
    details?: string;
    image?: string; // Base64 if relevant diagram/schema
  };
  category: string; // e.g., "Anatomy", "Pharmacology"
  difficulty: "easy" | "medium" | "hard";
}

interface GenerationResult {
  flashcards: Flashcard[];
  metadata: {
    totalPages: number;
    processingTime: number;
    subject: string;
  };
}
```

### 5. PDF Download
```
Flashcards JSON → jsPDF rendering → Blob → Download
```

## UI Components

```
src/
├── routes/
│   ├── __root.tsx          # Root layout
│   └── index.tsx           # Main page (upload → generate → download)
├── components/
│   ├── upload/
│   │   └── PDFDropzone.tsx # Drag & drop PDF upload
│   ├── generation/
│   │   ├── ProgressCard.tsx    # Generation progress
│   │   └── StreamingOutput.tsx # Real-time AI output
│   ├── flashcards/
│   │   ├── FlashcardGrid.tsx   # Grid of generated cards
│   │   ├── FlashcardItem.tsx   # Single flashcard (flip animation)
│   │   └── FlashcardPreview.tsx # PDF preview before download
│   └── ui/
│       └── ... # shadcn/ui components
├── lib/
│   ├── pdf-processor.ts   # PDF to images logic
│   ├── pdf-generator.ts   # Flashcards to PDF logic
│   └── gemini.ts          # AI client setup
└── server/
    └── functions/
        └── generate.ts    # Server function for generation
```

## Security Considerations

- **File Validation**: Only accept PDF files, max 20MB
- **Rate Limiting**: Limit requests per IP (server-side)
- **API Key Protection**: Gemini API key server-side only
- **No Storage**: Files processed in memory, never persisted

## MVP Scope (Strict)

### ✅ In Scope
1. Single PDF upload (max 20MB)
2. AI flashcard generation with images
3. Real-time generation progress
4. Flashcard preview with flip animation
5. PDF download of flashcards
6. Responsive design (mobile-friendly)

### ❌ Out of Scope (Post-MVP)
- User accounts
- Cloud storage
- Flashcard editing
- Spaced repetition
- Multiple file upload
- Export to Anki
- Sharing/collaboration
