-- Create growth_steps table in qciccimnfvloklqlhvvm (v2 Supabase)
-- This table stores individual growth procedure steps for each crop

CREATE TABLE IF NOT EXISTS growth_steps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  crop_id UUID NOT NULL,
  step_order INTEGER NOT NULL,
  step_type VARCHAR(50) NOT NULL,
  duration_hours INTEGER,
  notes TEXT,
  completed BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  FOREIGN KEY (crop_id) REFERENCES products(id) ON DELETE CASCADE
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_growth_steps_crop_id ON growth_steps(crop_id);
CREATE INDEX IF NOT EXISTS idx_growth_steps_step_order ON growth_steps(crop_id, step_order);

-- Enable RLS (Row Level Security)
ALTER TABLE growth_steps ENABLE ROW LEVEL SECURITY;

-- Create RLS policy to allow all access (adjust if you need row-level restrictions)
CREATE POLICY "Allow all access to growth_steps" ON growth_steps
  FOR ALL
  USING (true)
  WITH CHECK (true);
