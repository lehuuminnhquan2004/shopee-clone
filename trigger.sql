BEGIN;

-- Không tạo trigger khi dữ liệu cũ đã có ảnh ở tier 2.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM public.tier_options AS o
    JOIN public.product_tiers AS t ON t.id = o.tier_id
    WHERE t.position <> 1
      AND o.image_url IS NOT NULL
  ) THEN
    RAISE EXCEPTION 'Đã có option tier 2 chứa ảnh; hãy xử lý dữ liệu cũ trước';
  END IF;
END $$;

CREATE OR REPLACE FUNCTION public.check_tier_option_image()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  v_position integer;
BEGIN
  IF NEW.image_url IS NULL THEN
    RETURN NEW;
  END IF;

  SELECT t.position INTO v_position
  FROM public.product_tiers AS t
  WHERE t.id = NEW.tier_id
  FOR SHARE;

  IF v_position IS DISTINCT FROM 1 THEN
    RAISE EXCEPTION
      'Chỉ option thuộc tier thứ nhất mới được có image_url';
  END IF;

  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_check_tier_option_image
ON public.tier_options;

CREATE TRIGGER trg_check_tier_option_image
BEFORE INSERT OR UPDATE OF image_url, tier_id
ON public.tier_options
FOR EACH ROW
EXECUTE FUNCTION public.check_tier_option_image();

CREATE OR REPLACE FUNCTION public.check_tier_position_with_images()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.position <> 1 AND EXISTS (
    SELECT 1
    FROM public.tier_options AS o
    WHERE o.tier_id = NEW.id
      AND o.image_url IS NOT NULL
  ) THEN
    RAISE EXCEPTION
      'Không thể chuyển tier có option chứa ảnh khỏi vị trí thứ nhất';
  END IF;

  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_check_tier_position_with_images
ON public.product_tiers;

CREATE TRIGGER trg_check_tier_position_with_images
BEFORE UPDATE OF position
ON public.product_tiers
FOR EACH ROW
EXECUTE FUNCTION public.check_tier_position_with_images();

COMMIT;