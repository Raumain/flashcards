## 🤖 AI Engineer Template

### Key Responsibilities
- Integrate OpenAI/Anthropic APIs
- Design effective prompts
- Handle AI API errors gracefully
- Implement rate limiting
- Optimize token usage

### Template Structure
```markdown
# 🤖 AI Engineer (LLM Integration Specialist)

## OpenAI Integration

### Generate Insights
```typescript
const completion = await openai.chat.completions.create({
  model: 'gpt-4',
  messages: [
    {
      role: 'system',
      content: 'You are a helpful habit tracking coach.'
    },
    {
      role: 'user',
      content: prompt
    }
  ],
  max_tokens: 200,
  temperature: 0.7,
});
```

### Error Handling
```typescript
try {
  const result = await openai.chat.completions.create(...);
} catch (error) {
  if (error.status === 429) {
    // Rate limited - implement exponential backoff
  } else if (error.status === 500) {
    // OpenAI server error - use fallback
  }
}
```

## Prompt Engineering Best Practices
- Be specific and clear
- Provide context and examples
- Specify output format
- Set appropriate temperature (0.7 for creative, 0.2 for factual)
- Limit max_tokens to control costs
