# 🩺 MedFlash

AI-powered flashcard generator for medical students. Upload your PDF course materials and get study flashcards with relevant images and diagrams.

## Features

- 📄 **PDF Upload**: Drag & drop your medical course PDFs
- 🤖 **AI Generation**: Gemini analyzes text AND images to create flashcards
- 🖼️ **Visual Learning**: Relevant diagrams and schemas included in flashcards
- 📥 **PDF Download**: Export flashcards as a printable PDF
- 🚀 **No Account Needed**: Files processed in memory, nothing stored

## Tech Stack

- **Framework**: TanStack Start + TanStack Router
- **AI**: Google Gemini (via Vercel AI SDK)
- **PDF Processing**: pdf-lib, pdf2pic, sharp
- **PDF Generation**: jsPDF
- **Styling**: Tailwind CSS v4
- **Runtime**: Bun

## Getting Started

### Prerequisites

- [Bun](https://bun.sh/) v1.0+
- [Google AI API Key](https://ai.google.dev/)
- **poppler-utils** (required for PDF to image conversion)

#### Installing poppler-utils

```bash
# Ubuntu/Debian
sudo apt-get install poppler-utils

# macOS
brew install poppler

# Fedora/RHEL
sudo dnf install poppler-utils

# Arch Linux
sudo pacman -S poppler

# Windows (via Chocolatey)
choco install poppler

# Docker
# Add to your Dockerfile:
# RUN apt-get update && apt-get install -y poppler-utils
```

> **Note**: The `pdftoppm` command (part of poppler-utils) is required to convert PDF pages to images before sending them to the AI. Without this, PDF processing will fail with an `ENOENT` error.

### Installation

\`\`\`bash
# Install dependencies
bun install

# Set up environment variables
cp .env.example .env
# Edit .env and add your GOOGLE_API_KEY

# Start development server
bun run dev
\`\`\`

### Environment Variables

\`\`\`env
GOOGLE_API_KEY=your_gemini_api_key
\`\`\`

## Project Structure

\`\`\`
src/
├── routes/           # TanStack Router pages
├── components/       # React components
│   ├── upload/       # PDF upload components
│   ├── generation/   # AI generation UI
│   └── flashcards/   # Flashcard display
├── lib/              # Utilities
│   └── prompts/      # AI prompts
└── server/           # Server functions

agents/               # AI agent instructions
.github/project/      # Blueprint & roadmap
\`\`\`

## Development

This project uses an agent-based development workflow:

- [agents/](./agents/) - Specialized AI agents for different tasks
- [.github/project/roadmap.md](./.github/project/roadmap.md) - Implementation plan
- [.github/project/blueprint.md](./.github/project/blueprint.md) - Architecture
- [progress.txt](./progress.txt) - Development log

## License

MIT
