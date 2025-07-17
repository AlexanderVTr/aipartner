-- Add function to find only assistant messages
CREATE OR REPLACE FUNCTION find_similar_assistant_messages(
    query_embedding vector(1536),
    clerk_user_id TEXT,
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
    AND me.role = 'assistant'  -- Only assistant messages
    AND 1 - (me.embedding <=> query_embedding) > similarity_threshold
    ORDER BY me.embedding <=> query_embedding
    LIMIT match_count;
END;
$$;

-- Add function to find only user messages (for consistency)
CREATE OR REPLACE FUNCTION find_similar_user_messages(
    query_embedding vector(1536),
    clerk_user_id TEXT,
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
    AND me.role = 'user'  -- Only user messages
    AND 1 - (me.embedding <=> query_embedding) > similarity_threshold
    ORDER BY me.embedding <=> query_embedding
    LIMIT match_count;
END;
$$; 