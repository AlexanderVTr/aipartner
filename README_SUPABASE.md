# Supabase Integration Documentation

This document describes the Supabase database setup and integration for the AI Chat application.

## 🗄️ Database Schema

The application uses three main tables with vector search capabilities:

### Tables Structure

```sql
users {
    id UUID PRIMARY KEY
    clerk_user_id TEXT UNIQUE NOT NULL  -- Clerk authentication ID
    email TEXT NOT NULL
    tokens_balance INTEGER DEFAULT 0    -- User's token balance
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
}

messages {
    id UUID PRIMARY KEY
    user_id UUID REFERENCES users(id)   -- Message owner
    role TEXT CHECK (role IN ('user', 'assistant'))
    content TEXT NOT NULL               -- Message text
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
}

message_embeddings {
    message_id UUID PRIMARY KEY REFERENCES messages(id)
    embedding VECTOR(1536) NOT NULL     -- OpenAI embedding (1536 dimensions)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
}
```

### Relationships

- `users` → `messages` (one-to-many)
- `messages` → `message_embeddings` (one-to-one)

## 🚀 Setup Instructions

### 1. Install Dependencies

```bash
# Install Supabase client
pnpm add @supabase/supabase-js

# Install Supabase CLI (macOS)
brew install supabase/tap/supabase

# Or via npm
npm install -g supabase
```

### 2. Initialize Supabase

```bash
# Initialize project
supabase init

# Login to Supabase
supabase login

# Link to existing project
supabase link --project-ref YOUR_PROJECT_REF
```

### 3. Environment Variables

Create `.env.local`:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### 4. Database Migration

```bash
# Create migration
supabase migration new create_chat_schema

# Apply migration to cloud database
supabase db push

# Or reset local database (if using local development)
supabase db reset
```

### 5. Local Development (Optional)

```bash
# Start local Supabase stack
supabase start

# Stop local stack
supabase stop
```

## 🔧 Key Features

### Vector Search with pgvector

- **Extension**: `pgvector` for similarity search
- **Index**: HNSW index for fast approximate search
- **Dimensions**: 1536 (OpenAI embeddings)
- **Similarity**: Cosine similarity

### Row Level Security (RLS)

- Users can only access their own data
- Service role bypasses RLS for system operations
- Secure by default

### Custom Functions

#### `find_similar_messages`

Finds similar messages using vector similarity:

```sql
SELECT * FROM find_similar_messages(
    query_embedding := '[0.1, 0.2, ...]'::vector,
    user_uuid := 'user-id',
    similarity_threshold := 0.8,
    match_count := 5
);
```

#### `get_message_with_embedding`

Retrieves message with its embedding:

```sql
SELECT * FROM get_message_with_embedding('message-id');
```

## 💻 Client Configuration

### Basic Client (with RLS)

```typescript
// src/lib/ai/supabase/client.ts
import { createClient } from '@supabase/supabase-js'

export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
)
```

### Admin Client (bypasses RLS)

```typescript
export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  },
)
```

## 🧪 Testing

### Database Connection Test

```bash
curl http://localhost:3000/api/test-db
```

### Vector Embeddings Test

```bash
curl http://localhost:3000/api/test-embeddings
```

### Cleanup Test Data

```bash
curl -X POST http://localhost:3000/api/test-db
```

## 📝 Usage Examples

### Create User and Message

```typescript
import { supabaseAdmin } from '@/lib/ai/supabase/client'

// Create user
const { data: user } = await supabaseAdmin
  .from('users')
  .insert({
    clerk_user_id: 'clerk_user_123',
    email: 'user@example.com',
    tokens_balance: 100,
  })
  .select()
  .single()

// Create message
const { data: message } = await supabaseAdmin
  .from('messages')
  .insert({
    user_id: user.id,
    role: 'user',
    content: 'Hello, AI!',
  })
  .select()
  .single()
```

### Save Embedding

```typescript
import { openai } from '@/lib/ai/callOpenAi'

// Create embedding
const response = await openai.embeddings.create({
  model: 'text-embedding-3-small',
  input: 'Hello, AI!',
})

// Save to database
await supabaseAdmin.from('message_embeddings').insert({
  message_id: message.id,
  embedding: response.data[0].embedding,
})
```

### Vector Search

```typescript
// Find similar messages
const { data: similarMessages } = await supabaseAdmin.rpc(
  'find_similar_messages',
  {
    query_embedding: queryEmbedding,
    user_uuid: userId,
    similarity_threshold: 0.8,
    match_count: 5,
  },
)
```

## 🔍 Useful Commands

### Project Management

```bash
# List projects
supabase projects list

# Get project API keys
supabase projects api-keys --project-ref YOUR_PROJECT_REF

# Check project status
supabase status
```

### Database Operations

```bash
# Generate TypeScript types
supabase gen types typescript --project-id YOUR_PROJECT_REF > src/lib/supabase/types.ts

# Run SQL query
supabase sql --project-ref YOUR_PROJECT_REF --file query.sql

# Backup database
supabase db dump --project-ref YOUR_PROJECT_REF
```

### Migration Management

```bash
# Create new migration
supabase migration new migration_name

# List migrations
supabase migration list

# Squash migrations
supabase migration squash
```

## 🔒 Security Best Practices

1. **Never expose service role key** in client-side code
2. **Use RLS policies** for user data isolation
3. **Validate user input** before database operations
4. **Use prepared statements** to prevent SQL injection
5. **Monitor database usage** and set up alerts

## 🐛 Troubleshooting

### Common Issues

**RLS Policy Violations**

```
Error: new row violates row-level security policy
```

Solution: Use `supabaseAdmin` for system operations or update RLS policies.

**Vector Extension Missing**

```
Error: type "vector" does not exist
```

Solution: Ensure `pgvector` extension is enabled in your migration.

**Connection Issues**

```
Error: Failed to fetch
```

Solution: Check environment variables and network connectivity.

### Debug Commands

```bash
# Check local services
supabase status

# View logs
supabase logs

# Test connection
supabase db ping
```

## 📊 Performance Optimization

### Indexes

- `idx_users_clerk_user_id` - Fast user lookup
- `idx_messages_user_id` - User's messages
- `idx_messages_created_at` - Chronological sorting
- `idx_message_embeddings_vector` - Vector similarity search

### Query Optimization

- Use `select()` to limit returned columns
- Implement pagination with `range()`
- Use `single()` for single row results
- Batch operations when possible

## 📈 Monitoring

### Key Metrics to Track

- Database connections
- Query performance
- Storage usage
- Vector search latency
- RLS policy violations

### Supabase Dashboard

Monitor your project at: `https://supabase.com/dashboard/project/YOUR_PROJECT_REF`

---

## 🤝 Contributing

When making database changes:

1. Create a new migration file
2. Test locally first
3. Apply to staging environment
4. Update this documentation
5. Deploy to production

## 📚 Additional Resources

- [Supabase Documentation](https://supabase.com/docs)
- [pgvector Documentation](https://github.com/pgvector/pgvector)
- [OpenAI Embeddings Guide](https://platform.openai.com/docs/guides/embeddings)
- [Row Level Security Guide](https://supabase.com/docs/guides/auth/row-level-security)
