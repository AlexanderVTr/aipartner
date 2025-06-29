-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS vector;

-- Create users table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    clerk_user_id TEXT UNIQUE NOT NULL,
    email TEXT NOT NULL,
    tokens_balance INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create messages table
CREATE TABLE messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create message_embeddings table with pgvector
CREATE TABLE message_embeddings (
    message_id UUID PRIMARY KEY REFERENCES messages(id) ON DELETE CASCADE,
    embedding vector(1536) NOT NULL, -- OpenAI embeddings are 1536 dimensions
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_users_clerk_user_id ON users(clerk_user_id);
CREATE INDEX idx_messages_user_id ON messages(user_id);
CREATE INDEX idx_messages_created_at ON messages(created_at DESC);

-- Create vector similarity index (HNSW for fast approximate search)
CREATE INDEX idx_message_embeddings_vector ON message_embeddings 
USING hnsw (embedding vector_cosine_ops);

-- Enable RLS (Row Level Security)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_embeddings ENABLE ROW LEVEL SECURITY;

-- RLS Policies for users table
CREATE POLICY "Users can view own profile" ON users
    FOR SELECT USING (clerk_user_id = auth.jwt() ->> 'sub');

CREATE POLICY "Users can update own profile" ON users
    FOR UPDATE USING (clerk_user_id = auth.jwt() ->> 'sub');

-- RLS Policies for messages table
CREATE POLICY "Users can view own messages" ON messages
    FOR SELECT USING (
        user_id IN (
            SELECT id FROM users WHERE clerk_user_id = auth.jwt() ->> 'sub'
        )
    );

CREATE POLICY "Users can insert own messages" ON messages
    FOR INSERT WITH CHECK (
        user_id IN (
            SELECT id FROM users WHERE clerk_user_id = auth.jwt() ->> 'sub'
        )
    );

-- RLS Policies for message_embeddings table
CREATE POLICY "Users can view own message embeddings" ON message_embeddings
    FOR SELECT USING (
        message_id IN (
            SELECT m.id FROM messages m
            JOIN users u ON m.user_id = u.id
            WHERE u.clerk_user_id = auth.jwt() ->> 'sub'
        )
    );

-- Service role can manage embeddings (для системных операций)
CREATE POLICY "Service role can manage embeddings" ON message_embeddings
    FOR ALL USING (auth.role() = 'service_role');

-- Функция для поиска похожих сообщений
CREATE OR REPLACE FUNCTION find_similar_messages(
    query_embedding vector(1536),
    user_uuid UUID,
    similarity_threshold float DEFAULT 0.8,
    match_count int DEFAULT 5
)
RETURNS TABLE (
    message_id UUID,
    content TEXT,
    similarity FLOAT
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        m.id,
        m.content,
        1 - (me.embedding <=> query_embedding) AS similarity
    FROM message_embeddings me
    JOIN messages m ON me.message_id = m.id
    WHERE m.user_id = user_uuid
    AND 1 - (me.embedding <=> query_embedding) > similarity_threshold
    ORDER BY me.embedding <=> query_embedding
    LIMIT match_count;
END;
$$;

-- Функция для получения сообщения с эмбеддингом
CREATE OR REPLACE FUNCTION get_message_with_embedding(message_uuid UUID)
RETURNS TABLE (
    id UUID,
    content TEXT,
    role TEXT,
    embedding vector(1536),
    created_at TIMESTAMPTZ
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        m.id,
        m.content,
        m.role,
        me.embedding,
        m.created_at
    FROM messages m
    LEFT JOIN message_embeddings me ON m.id = me.message_id
    WHERE m.id = message_uuid;
END;
$$;
