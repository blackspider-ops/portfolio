-- Add signals_badges column to site_settings
-- This stores the badges displayed below the hero section (HackPSU, Schreyer Honors, etc.)

ALTER TABLE site_settings 
ADD COLUMN IF NOT EXISTS signals_badges JSONB DEFAULT '[
  {"id": "hackpsu", "label": "HACKPSU", "icon": "code", "enabled": true},
  {"id": "schreyer", "label": "SCHREYER HONORS", "icon": "academic", "enabled": true},
  {"id": "devspsu", "label": "DEVS@PSU", "icon": "users", "enabled": true}
]'::jsonb;
