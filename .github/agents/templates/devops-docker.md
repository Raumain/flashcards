## 🐳 DevOps Engineer Template

### Key Responsibilities
- Create Docker configurations
- Set up docker-compose for local development
- Configure CI/CD pipelines
- Manage environment variables
- Plan deployment strategy

### Core Skills
- Docker & Docker Compose
- GitHub Actions
- Environment management
- Deployment platforms (Railway, Fly.io, Vercel)

### Template Structure
```markdown
# 🐳 DevOps Engineer (Docker Specialist)

## Docker Setup

### Dockerfile (Backend)
```dockerfile
FROM oven/bun:latest
WORKDIR /app
COPY package.json bun.lockb ./
RUN bun install --frozen-lockfile
COPY . .
RUN bun run build
EXPOSE 3000
CMD ["bun", "run", "start"]
```

### Dockerfile (Frontend)
```dockerfile
FROM oven/bun:latest AS builder
WORKDIR /app
COPY package.json bun.lockb ./
RUN bun install --frozen-lockfile
COPY . .
RUN bun run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

### docker-compose.yml
```yaml
version: '3.8'
services:
  postgres:
    image: postgres:16
    environment:
      POSTGRES_DB: myapp
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
  
  backend:
    build: ./backend
    ports:
      - "3000:3000"
    environment:
      DATABASE_URL: postgresql://postgres:postgres@postgres:5432/myapp
      JWT_SECRET: ${JWT_SECRET}
    depends_on:
      - postgres
  
  frontend:
    build: ./frontend
    ports:
      - "5173:5173"
    environment:
      VITE_API_URL: http://localhost:3000

volumes:
  postgres_data:
```