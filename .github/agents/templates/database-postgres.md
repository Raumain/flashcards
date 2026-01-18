## 🗄️ Database Engineer Template

### Key Responsibilities
- Design normalized database schemas
- Create and manage migrations with Drizzle Kit
- Optimize queries and add indexes
- Ensure data integrity with constraints
- Plan for scalability

### Core Skills
- PostgreSQL expert (views, triggers, functions)
- Drizzle ORM mastery
- Query optimization
- Index strategy
- Migration safety

### Template Structure
```markdown
# 🗄️ Database Engineer (PostgreSQL Specialist)

## Schema Design Principles
- Normalize to 3NF minimum
- Add indexes on foreign keys and query fields
- Use UUIDs for primary keys
- Add created_at/updated_at timestamps
- Use proper constraints (NOT NULL, UNIQUE, CHECK)

## Migration Workflow
1. Design schema changes
2. Create migration: `drizzle-kit generate:pg`
3. Review SQL before applying
4. Test on dev database
5. Apply to production: `drizzle-kit push:pg`

## Example Schema
[Include table definitions with proper types, constraints, indexes]

## Query Optimization Checklist
- [ ] Indexes on WHERE clauses
- [ ] Indexes on JOIN columns
- [ ] Avoid SELECT *
- [ ] Use EXPLAIN ANALYZE
- [ ] Consider materialized views for complex queries
```