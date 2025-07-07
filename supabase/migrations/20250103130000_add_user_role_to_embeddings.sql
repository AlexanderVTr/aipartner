-- Add user_id and role fields to message_embeddings table
-- This improves performance by avoiding JOINs during vector search

-- Step 1: Add new columns to message_embeddings table
ALTER TABLE message_embeddings 
ADD COLUMN user_id TEXT,
ADD COLUMN role TEXT;

-- Step 2: Populate existing data from messages table
UPDATE message_embeddings 
SET 
    user_id = (SELECT m.user_id FROM messages m WHERE m.id = message_embeddings.message_id),
    role = (SELECT m.role FROM messages m WHERE m.id = message_embeddings.message_id);

-- Step 3: Make columns NOT NULL after populating
ALTER TABLE message_embeddings 
ALTER COLUMN user_id SET NOT NULL,
ALTER COLUMN role SET NOT NULL;

-- Step 4: Add constraint to ensure valid roles
ALTER TABLE message_embeddings 
ADD CONSTRAINT check_role CHECK (role IN ('user', 'assistant'));

-- Step 5: Create composite index for fast user+role filtering
CREATE INDEX idx_embeddings_user_role ON message_embeddings(user_id, role);

-- Step 6: Update RLS policies for message_embeddings
DROP POLICY IF EXISTS "Users can view own message embeddings" ON message_embeddings;
DROP POLICY IF EXISTS "Service role can manage embeddings" ON message_embeddings;

-- New RLS policy using direct user_id field (no JOIN needed)
CREATE POLICY "Users can view own message embeddings" ON message_embeddings
    FOR SELECT USING (user_id = auth.jwt() ->> 'sub');

-- Service role can manage embeddings
CREATE POLICY "Service role can manage embeddings" ON message_embeddings
    FOR ALL USING (auth.role() = 'service_role');

-- Step 7: Update the similarity search function to use direct filtering
CREATE OR REPLACE FUNCTION find_similar_messages(
    query_embedding vector(1536),
    clerk_user_id TEXT,
    include_assistant boolean DEFAULT true,
    similarity_threshold float DEFAULT 0.8,
    match_count int DEFAULT 5
)
RETURNS TABLE (
    message_id UUID,
    content TEXT,
    role TEXT,
    similarity FLOAT
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        me.message_id,
        m.content,
        me.role,
        1 - (me.embedding <=> query_embedding) AS similarity
    FROM message_embeddings me
    JOIN messages m ON me.message_id = m.id
    WHERE me.user_id = clerk_user_id
    AND (include_assistant OR me.role = 'user')
    AND 1 - (me.embedding <=> query_embedding) > similarity_threshold
    ORDER BY me.embedding <=> query_embedding
    LIMIT match_count;
END;
$$; 