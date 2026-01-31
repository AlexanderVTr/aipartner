-- Add 'demo' option to plan column CHECK constraint
-- First, drop the existing constraint by finding its name
DO $$
DECLARE
    constraint_name TEXT;
BEGIN
    -- Find the constraint name for the plan column CHECK constraint
    -- Check constraints that reference 'plan' in their definition
    SELECT conname INTO constraint_name
    FROM pg_constraint
    WHERE conrelid = 'users'::regclass
      AND contype = 'c'
      AND pg_get_constraintdef(oid) LIKE '%plan%';
    
    -- Drop the constraint if found
    IF constraint_name IS NOT NULL THEN
        EXECUTE format('ALTER TABLE users DROP CONSTRAINT %I', constraint_name);
    END IF;
END $$;

-- Add new CHECK constraint that includes 'demo'
ALTER TABLE users 
ADD CONSTRAINT users_plan_check CHECK (plan IN ('free', 'pro', 'premium', 'demo'));

