# flashcards

AI flashcards based on a pdf

## 🚀 Built with saas-forge

This project was initialized with [saas-forge](https://github.com/yourusername/saas-forge), an AI-powered SaaS builder.

## 📋 Getting Started

### 1. Brief the Orchestrator

Open GitHub Copilot Chat in VSCode and reference the orchestrator:

```
@#file:.github/agents/core/orchestrator.json

AI flashcards based on a pdf

[Add more details about features, target users, business model, etc.]
```

### 2. Follow the Orchestrator's Guidance

The orchestrator will:
- Analyze your requirements
- Generate specialized agents
- Create a detailed blueprint and roadmap
- Guide you through implementation

### 3. Build with AI Agents

Delegate tasks to specialized agents:
- Frontend Engineer: UI/UX implementation
- Backend Engineer: API & business logic
- Database Engineer: Schema & migrations
- DevOps Engineer: Infrastructure & deployment

## 📁 Project Structure

```
.github/
├── agents/
│   ├── core/              # Universal agents
│   ├── templates/         # Agent templates
│   └── project/           # Project-specific generated agents
├── project/
│   ├── brief.md          # Project brief
│   ├── blueprint.md      # System design (generated)
│   ├── roadmap.md        # Implementation plan (generated)
│   └── history.json      # Task history
└── workflows/            # GitHub Actions
```

## 🤖 Available Agents

All agents are accessible via GitHub Copilot Chat:

### Core Agents (Always Available)
- `orchestrator.json` - Project manager & task delegator
- `architect.md` - System designer
- `code-reviewer.md` - PR reviewer
- `qa-engineer.md` - Testing & quality assurance

### Specialized Agents (Generated as Needed)
- Frontend, Backend, Database, DevOps, Payments, AI, Mobile, etc.

## 🛠️ Tech Stack

The tech stack will be determined by the orchestrator based on your requirements.

Default stack:
- **Frontend**: React 19 + Vite + TypeScript + TanStack
- **Backend**: Elysia + TypeScript
- **Database**: PostgreSQL
- **Auth**: Better-auth
- **Runtime**: Bun
- **Infrastructure**: Docker + Docker Compose

## 📝 Development Workflow

1. **Ask orchestrator for next task**
2. **Orchestrator delegates to specialist agent**
3. **Agent implements feature autonomously**
4. **Agent creates PR via GitHub MCP**
5. **Code reviewer reviews PR**
6. **Auto-merge on approval**
7. **Repeat**

## 🔗 Resources

- [saas-forge Documentation](https://github.com/yourusername/saas-forge)
- [GitHub Copilot Chat](https://docs.github.com/en/copilot/github-copilot-chat)
- [MCP Documentation](https://github.com/github/copilot-mcp)

## 📄 License

MIT
