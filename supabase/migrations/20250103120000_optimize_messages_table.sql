-- Optimize messages table to use Clerk user ID directly
-- This eliminates the need for user table lookup when saving messages

-- Step 1: Drop ALL existing policies and constraints that depend on user_id
ALTER TABLE messages DROP CONSTRAINT IF EXISTS messages_user_id_fkey;
DROP POLICY IF EXISTS "Users can view own messages" ON messages;
DROP POLICY IF EXISTS "Users can insert own messages" ON messages;

-- Drop message_embeddings policies that depend on messages.user_id
DROP POLICY IF EXISTS "Users can view own message embeddings" ON message_embeddings;
DROP POLICY IF EXISTS "Service role can manage embeddings" ON message_embeddings;

-- Step 2: Add new column for Clerk user ID
ALTER TABLE messages ADD COLUMN clerk_user_id TEXT;

-- Step 3: Populate the new column with data from users table
UPDATE messages 
SET clerk_user_id = (
    SELECT u.clerk_user_id 
    FROM users u 
    WHERE u.id = messages.user_id
);

-- Step 4: Make the new column NOT NULL after populating
ALTER TABLE messages ALTER COLUMN clerk_user_id SET NOT NULL;

-- Step 5: Drop the old user_id column and rename the new one
ALTER TABLE messages DROP COLUMN user_id;
ALTER TABLE messages RENAME COLUMN clerk_user_id TO user_id;

-- Step 6: Create new simplified RLS policies for messages
CREATE POLICY "Users can view own messages" ON messages
    FOR SELECT USING (user_id = auth.jwt() ->> 'sub');

CREATE POLICY "Users can insert own messages" ON messages
    FOR INSERT WITH CHECK (user_id = auth.jwt() ->> 'sub');

-- Step 7: Update index
DROP INDEX IF EXISTS idx_messages_user_id;
CREATE INDEX idx_messages_user_id ON messages(user_id);

-- Step 8: Recreate message_embeddings policies with updated logic
CREATE POLICY "Users can view own message embeddings" ON message_embeddings
    FOR SELECT USING (
        message_id IN (
            SELECT m.id FROM messages m
            WHERE m.user_id = auth.jwt() ->> 'sub'
        )
    );

-- Service role can manage embeddings
CREATE POLICY "Service role can manage embeddings" ON message_embeddings
    FOR ALL USING (auth.role() = 'service_role');

-- Step 9: Update the similarity search function
CREATE OR REPLACE FUNCTION find_similar_messages(
    query_embedding vector(1536),
    clerk_user_id TEXT,
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
    WHERE m.user_id = clerk_user_id
    AND 1 - (me.embedding <=> query_embedding) > similarity_threshold
    ORDER BY me.embedding <=> query_embedding
    LIMIT match_count;
END;
$$; 