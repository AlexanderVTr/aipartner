-- Add plan and updated_at fields to users table
ALTER TABLE users 
ADD COLUMN plan TEXT DEFAULT 'free' CHECK (plan IN ('free', 'pro', 'premium')),
ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Create index for plan field for better performance
CREATE INDEX idx_users_plan ON users(plan);

-- Create function to automatically update updated_at field
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at on any update
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Update existing users to have default plan if not set
UPDATE users SET plan = 'free' WHERE plan IS NULL; 