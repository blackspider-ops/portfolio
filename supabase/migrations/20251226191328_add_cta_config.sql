-- Add cta_config column to site_settings for CTA button actions
ALTER TABLE site_settings
ADD COLUMN IF NOT EXISTS cta_config JSONB DEFAULT '{
  "primary_action": "phone_mock",
  "primary_link": "",
  "secondary_action": "phone_mock",
  "secondary_link": ""
}'::jsonb;
