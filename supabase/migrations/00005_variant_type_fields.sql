-- Add variant type fields for Ulta-style product page:
-- variant_type distinguishes size vs color selectors
-- color_hex / swatch_image for color swatches
-- variant_images for variant-specific image galleries
-- description for variant-level detail

ALTER TABLE product_variants
  ADD COLUMN variant_type text NOT NULL DEFAULT 'size'
    CHECK (variant_type IN ('size', 'color')),
  ADD COLUMN color_hex text,
  ADD COLUMN swatch_image text,
  ADD COLUMN variant_images text[],
  ADD COLUMN description text;

COMMENT ON COLUMN product_variants.variant_type IS 'size or color — determines UI rendering';
COMMENT ON COLUMN product_variants.color_hex IS 'Hex color for swatch display (color variants)';
COMMENT ON COLUMN product_variants.swatch_image IS 'Optional swatch image URL (color variants)';
COMMENT ON COLUMN product_variants.variant_images IS 'Variant-specific images that replace gallery on selection';
COMMENT ON COLUMN product_variants.description IS 'Optional variant-level description';
