-- Add terminal_commands table for dynamic terminal commands
CREATE TABLE IF NOT EXISTS terminal_commands (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(50) NOT NULL UNIQUE,
  description TEXT NOT NULL,
  usage TEXT,
  category VARCHAR(50) DEFAULT 'custom',
  output_type VARCHAR(20) DEFAULT 'text' CHECK (output_type IN ('text', 'error', 'success', 'ascii', 'list')),
  output_content TEXT NOT NULL,
  output_items TEXT[], -- For list type outputs
  is_system BOOLEAN DEFAULT false, -- System commands can't be deleted
  is_enabled BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_terminal_commands_name ON terminal_commands(name);
CREATE INDEX IF NOT EXISTS idx_terminal_commands_enabled ON terminal_commands(is_enabled);

-- Enable RLS
ALTER TABLE terminal_commands ENABLE ROW LEVEL SECURITY;

-- Allow public read access for enabled commands
CREATE POLICY "Public can read enabled terminal commands"
  ON terminal_commands FOR SELECT
  USING (is_enabled = true);

-- Allow admins full access
CREATE POLICY "Admins can manage terminal commands"
  ON terminal_commands FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
      AND role = 'admin'
    )
  );

-- Insert default custom commands (non-system ones that can be edited)
INSERT INTO terminal_commands (name, description, usage, category, output_type, output_content, is_system, sort_order) VALUES
('hello', 'Say hello', 'hello [name]', 'custom', 'text', 'Hello, World! Welcome to my portfolio.', false, 1),
('about', 'About this portfolio', NULL, 'custom', 'text', 'This portfolio was built with Next.js, TypeScript, Tailwind CSS, and Supabase. It features a custom terminal, interactive phone mockup, and retro arcade games.', false, 2),
('projects', 'Quick projects summary', NULL, 'custom', 'text', 'Check out my projects at /projects or use "ls projects" for a detailed list.', false, 3),
('hire', 'Hiring information', NULL, 'custom', 'success', '✨ I''m currently open to new opportunities! Feel free to reach out via the contact page or email.', false, 4),
('coffee', 'Get some coffee', NULL, 'fun', 'ascii', '
   ( (
    ) )
  ........
  |      |]
  \      /
   `----''
  
☕ Here''s a virtual coffee for you!', false, 5),
('ping', 'Ping pong', NULL, 'fun', 'success', '🏓 Pong!', false, 6),
('joke', 'Tell a programming joke', NULL, 'fun', 'text', 'Why do programmers prefer dark mode? Because light attracts bugs! 🐛', false, 7)
ON CONFLICT (name) DO NOTHING;

-- Add trigger for updated_at
CREATE OR REPLACE FUNCTION update_terminal_commands_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_terminal_commands_updated_at
  BEFORE UPDATE ON terminal_commands
  FOR EACH ROW
  EXECUTE FUNCTION update_terminal_commands_updated_at();
