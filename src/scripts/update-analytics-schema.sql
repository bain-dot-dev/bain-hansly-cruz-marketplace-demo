-- Add listing_id field to direct_charges table for better analytics
ALTER TABLE direct_charges ADD COLUMN IF NOT EXISTS listing_id UUID REFERENCES listings(id);

-- Create index for the new column
CREATE INDEX IF NOT EXISTS idx_direct_charges_listing_id ON direct_charges(listing_id);

-- Update existing records to populate listing_id from metadata
UPDATE direct_charges 
SET listing_id = (metadata->>'post_id')::UUID 
WHERE metadata->>'post_id' IS NOT NULL 
  AND listing_id IS NULL;

-- Display the results
SELECT 
  'Added listing_id field to direct_charges table' as action,
  COUNT(*) as updated_records
FROM direct_charges 
WHERE listing_id IS NOT NULL;
