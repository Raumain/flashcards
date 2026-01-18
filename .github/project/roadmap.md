# 🗺️ MedFlash - Implementation Roadmap

## Overview

This roadmap breaks down MedFlash into 4 phases with discrete tasks. Each task is assigned to a specific agent and has clear completion criteria.

---

## Phase 1: Foundation Setup
**Owner**: Setup Agent
**Duration**: ~30 minutes

| # | Task | Agent | Dependencies | Completion Criteria |
|---|------|-------|--------------|---------------------|
| 1.1 | Initialize TanStack Start project | Setup | None | `bun run dev` runs without errors |
| 1.2 | Configure Tailwind CSS v4 | Setup | 1.1 | Tailwind classes work in components |
| 1.3 | Set up Biome linting | Setup | 1.1 | `bun run lint` works |
| 1.4 | Create folder structure | Setup | 1.1 | All directories exist |
| 1.5 | Configure environment variables | Setup | 1.1 | `.env.example` created |

---

## Phase 2: Backend & AI Integration
**Owners**: Backend Agent, Prompt Agent
**Duration**: ~2 hours

| # | Task | Agent | Dependencies | Completion Criteria |
|---|------|-------|--------------|---------------------|
| 2.1 | Create PDF processing utility | Backend | Phase 1 | PDF converts to images array |
| 2.2 | Design flashcard generation prompt | Prompt | None | Prompt documented with schema |
| 2.3 | Set up Gemini integration | Backend | 1.5 | Test API call succeeds |
| 2.4 | Create generate server function | Backend | 2.1, 2.2, 2.3 | Endpoint returns flashcards |
| 2.5 | Add response streaming | Backend | 2.4 | Streaming works in browser |
| 2.6 | Create PDF generator utility | Backend | Phase 1 | Flashcards export to PDF |

---

## Phase 3: Frontend Implementation  
**Owner**: Frontend Agent
**Duration**: ~2 hours

| # | Task | Agent | Dependencies | Completion Criteria |
|---|------|-------|--------------|---------------------|
| 3.1 | Create root layout | Frontend | Phase 1 | Base layout renders |
| 3.2 | Build PDFDropzone component | Frontend | 3.1 | Can upload PDF files |
| 3.3 | Build GenerationProgress component | Frontend | 3.1 | Shows streaming output |
| 3.4 | Build FlashcardItem component | Frontend | 3.1 | Card flips on click |
| 3.5 | Build FlashcardGrid component | Frontend | 3.4 | Grid of cards renders |
| 3.6 | Build DownloadButton component | Frontend | 3.5 | Triggers PDF download |
| 3.7 | Create main page flow | Frontend | 3.2-3.6 | Full flow works |
| 3.8 | Add responsive styles | Frontend | 3.7 | Works on mobile |

---

## Phase 4: Integration & Polish
**Owners**: All Agents
**Duration**: ~1 hour

| # | Task | Agent | Dependencies | Completion Criteria |
|---|------|-------|--------------|---------------------|
| 4.1 | Connect frontend to backend | Frontend | Phase 2, Phase 3 | End-to-end works |
| 4.2 | Add error handling UI | Frontend | 4.1 | Errors display nicely |
| 4.3 | Add loading states | Frontend | 4.1 | All states covered |
| 4.4 | End-to-end testing | QA | 4.3 | All tests pass |
| 4.5 | Performance optimization | Frontend | 4.4 | Meets benchmarks |
| 4.6 | Final polish | Frontend | 4.5 | Production ready |

---

## Task Execution Protocol

### To Start a Task:
1. Open the relevant agent file: `agents/<agent>-agent.md`
2. State: "Execute task X.X: [task name]"
3. Agent reads context files listed in its instructions
4. Agent implements the task
5. Agent appends progress to `progress.txt`

### Example Invocation:
```
Read agents/setup-agent.md

Execute task 1.1: Initialize TanStack Start project
```

---

## Current Status

| Phase | Status | Progress |
|-------|--------|----------|
| Phase 1 | 🟡 Ready | 0/5 tasks |
| Phase 2 | ⏳ Blocked | 0/6 tasks |
| Phase 3 | ⏳ Blocked | 0/8 tasks |
| Phase 4 | ⏳ Blocked | 0/6 tasks |

**Next Task**: 1.1 - Initialize TanStack Start project (Setup Agent)

---

## Quick Reference: Agent Assignments

| Agent | Primary Tasks |
|-------|---------------|
| **Setup Agent** | 1.1 - 1.5 (Foundation) |
| **Backend Agent** | 2.1, 2.3 - 2.6 (Server & PDF) |
| **Prompt Agent** | 2.2 (AI Prompts) |
| **Frontend Agent** | 3.1 - 3.8, 4.1 - 4.3, 4.5 - 4.6 (UI) |
| **QA Agent** | 4.4 (Testing) |

---

## Success Criteria (MVP)

The MVP is complete when a user can:
1. ✅ Visit the app
2. ✅ Upload a PDF (medical content)
3. ✅ See generation progress
4. ✅ View generated flashcards with images
5. ✅ Flip cards to see answers
6. ✅ Download flashcards as PDF
