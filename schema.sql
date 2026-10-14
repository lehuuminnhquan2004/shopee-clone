-- =====================================================================
-- THIẾT KẾ DATABASE SÀN THƯƠNG MẠI ĐIỆN TỬ (THAM KHẢO MÔ HÌNH SHOPEE)
-- MySQL 8.0 / InnoDB / utf8mb4
--
-- Lưu ý: đây là thiết kế suy ra từ API công khai của Shopee Open Platform
-- và các thực hành phổ biến, KHÔNG phải sơ đồ DB nội bộ thật của Shopee.
--
-- Quy ước:
--   - Khóa chính: BIGINT UNSIGNED AUTO_INCREMENT
--   - Tiền VND: BIGINT UNSIGNED (đơn vị đồng, không dùng số lẻ)
--   - Thời gian: DATETIME(3) hoặc TIMESTAMP, lưu theo UTC
--   - Xóa mềm: cột deleted_at (NULL = chưa xóa)
--
-- Mục lục:
--   1. Người dùng & địa chỉ
--   2. Shop
--   3. Danh mục, thương hiệu, thuộc tính
--   4. Sản phẩm (item), ảnh, thuộc tính
--   5. Phân loại hàng (tier) & biến thể (model/SKU)
--   6. Tồn kho
--   7. Giỏ hàng & wishlist
--   8. Voucher & Flash sale
--   9. Đơn hàng
--  10. Thanh toán
--  11. Vận chuyển
--  12. Trả hàng / hoàn tiền
--  13. Đánh giá
--  14. Thông báo
-- =====================================================================

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- =====================================================================
-- 1. NGƯỜI DÙNG & ĐỊA CHỈ
-- =====================================================================

CREATE TABLE users (
  id            BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  username      VARCHAR(50)  NOT NULL,
  email         VARCHAR(255) NULL,
  phone         VARCHAR(20)  NULL,
  password_hash VARCHAR(255) NOT NULL,           -- bcrypt/argon2, KHÔNG lưu mật khẩu thô
  full_name     VARCHAR(100) NULL,
  avatar_url    VARCHAR(500) NULL,
  gender        ENUM('male','female','other') NULL,
  birth_date    DATE NULL,
  role          ENUM('buyer','seller','admin') NOT NULL DEFAULT 'buyer',
  status        ENUM('active','locked','deleted') NOT NULL DEFAULT 'active',
  email_verified_at DATETIME NULL,
  phone_verified_at DATETIME NULL,
  last_login_at DATETIME NULL,
  created_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at    DATETIME NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_users_username (username),
  UNIQUE KEY uq_users_email (email),
  UNIQUE KEY uq_users_phone (phone)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Phiên đăng nhập / refresh token (cho phép đăng xuất từng thiết bị)
CREATE TABLE user_sessions (
  id            BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id       BIGINT UNSIGNED NOT NULL,
  refresh_token_hash CHAR(64) NOT NULL,          -- lưu hash SHA-256 của token
  user_agent    VARCHAR(500) NULL,
  ip_address    VARCHAR(45) NULL,
  expires_at    DATETIME NOT NULL,
  revoked_at    DATETIME NULL,
  created_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_sessions_token (refresh_token_hash),
  KEY idx_sessions_user (user_id),
  CONSTRAINT fk_sessions_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Danh mục hành chính Việt Nam (tỉnh/thành, quận/huyện, phường/xã)
CREATE TABLE provinces (
  id   INT UNSIGNED NOT NULL AUTO_INCREMENT,
  code VARCHAR(10) NOT NULL,
  name VARCHAR(100) NOT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_provinces_code (code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE districts (
  id          INT UNSIGNED NOT NULL AUTO_INCREMENT,
  province_id INT UNSIGNED NOT NULL,
  code        VARCHAR(10) NOT NULL,
  name        VARCHAR(100) NOT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_districts_code (code),
  KEY idx_districts_province (province_id),
  CONSTRAINT fk_districts_province FOREIGN KEY (province_id) REFERENCES provinces(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE wards (
  id          INT UNSIGNED NOT NULL AUTO_INCREMENT,
  district_id INT UNSIGNED NOT NULL,
  code        VARCHAR(10) NOT NULL,
  name        VARCHAR(100) NOT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_wards_code (code),
  KEY idx_wards_district (district_id),
  CONSTRAINT fk_wards_district FOREIGN KEY (district_id) REFERENCES districts(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Sổ địa chỉ giao hàng của người mua
CREATE TABLE user_addresses (
  id             BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id        BIGINT UNSIGNED NOT NULL,
  receiver_name  VARCHAR(100) NOT NULL,
  receiver_phone VARCHAR(20)  NOT NULL,
  province_id    INT UNSIGNED NOT NULL,
  district_id    INT UNSIGNED NOT NULL,
  ward_id        INT UNSIGNED NOT NULL,
  address_detail VARCHAR(255) NOT NULL,          -- số nhà, tên đường
  address_type   ENUM('home','office') NOT NULL DEFAULT 'home',
  is_default     TINYINT(1) NOT NULL DEFAULT 0,
  created_at     TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at     TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at     DATETIME NULL,
  PRIMARY KEY (id),
  KEY idx_addr_user (user_id),
  CONSTRAINT fk_addr_user     FOREIGN KEY (user_id)     REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_addr_province FOREIGN KEY (province_id) REFERENCES provinces(id),
  CONSTRAINT fk_addr_district FOREIGN KEY (district_id) REFERENCES districts(id),
  CONSTRAINT fk_addr_ward     FOREIGN KEY (ward_id)     REFERENCES wards(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- =====================================================================
-- 2. SHOP
-- =====================================================================

CREATE TABLE shops (
  id             BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  owner_id       BIGINT UNSIGNED NOT NULL,       -- 1 user chủ sở hữu 1 shop
  name           VARCHAR(100) NOT NULL,
  slug           VARCHAR(120) NOT NULL,
  description    TEXT NULL,
  logo_url       VARCHAR(500) NULL,
  banner_url     VARCHAR(500) NULL,
  pickup_address_id BIGINT UNSIGNED NULL,        -- địa chỉ lấy hàng (trỏ user_addresses)
  status         ENUM('pending','active','suspended','closed') NOT NULL DEFAULT 'pending',
  is_official    TINYINT(1) NOT NULL DEFAULT 0,  -- Shopee Mall
  rating_avg     DECIMAL(3,2) NOT NULL DEFAULT 0.00,
  rating_count   INT UNSIGNED NOT NULL DEFAULT 0,
  follower_count INT UNSIGNED NOT NULL DEFAULT 0,
  response_rate  DECIMAL(5,2) NULL,              -- tỉ lệ phản hồi chat (%)
  created_at     TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at     TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_shops_owner (owner_id),
  UNIQUE KEY uq_shops_slug (slug),
  CONSTRAINT fk_shops_owner  FOREIGN KEY (owner_id) REFERENCES users(id),
  CONSTRAINT fk_shops_pickup FOREIGN KEY (pickup_address_id) REFERENCES user_addresses(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE shop_followers (
  shop_id    BIGINT UNSIGNED NOT NULL,
  user_id    BIGINT UNSIGNED NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (shop_id, user_id),
  KEY idx_followers_user (user_id),
  CONSTRAINT fk_followers_shop FOREIGN KEY (shop_id) REFERENCES shops(id) ON DELETE CASCADE,
  CONSTRAINT fk_followers_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Danh mục riêng của shop (Shopee cho shop tự nhóm sản phẩm)
CREATE TABLE shop_categories (
  id        BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  shop_id   BIGINT UNSIGNED NOT NULL,
  name      VARCHAR(100) NOT NULL,
  position  INT NOT NULL DEFAULT 0,
  PRIMARY KEY (id),
  KEY idx_shopcat_shop (shop_id),
  CONSTRAINT fk_shopcat_shop FOREIGN KEY (shop_id) REFERENCES shops(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- =====================================================================
-- 3. DANH MỤC, THƯƠNG HIỆU, THUỘC TÍNH
-- =====================================================================

-- Cây danh mục nhiều cấp: Thời trang nam > Áo > Áo thun
CREATE TABLE categories (
  id         BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  parent_id  BIGINT UNSIGNED NULL,
  name       VARCHAR(100) NOT NULL,
  slug       VARCHAR(120) NOT NULL,
  level      TINYINT UNSIGNED NOT NULL DEFAULT 1,  -- cấp 1, 2, 3...
  path       VARCHAR(255) NOT NULL DEFAULT '',     -- vd: '/1/12/45/' để lấy toàn bộ con cháu nhanh
  icon_url   VARCHAR(500) NULL,
  position   INT NOT NULL DEFAULT 0,
  is_leaf    TINYINT(1) NOT NULL DEFAULT 1,        -- chỉ danh mục lá mới đăng sản phẩm được
  is_active  TINYINT(1) NOT NULL DEFAULT 1,
  PRIMARY KEY (id),
  UNIQUE KEY uq_categories_slug (slug),
  KEY idx_categories_parent (parent_id),
  KEY idx_categories_path (path),
  CONSTRAINT fk_categories_parent FOREIGN KEY (parent_id) REFERENCES categories(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE brands (
  id       BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  name     VARCHAR(100) NOT NULL,
  logo_url VARCHAR(500) NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_brands_name (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Thuộc tính mô tả sản phẩm theo từng danh mục (khác với phân loại hàng):
-- vd danh mục "Áo thun": Chất liệu, Kiểu dáng, Xuất xứ, Mùa
CREATE TABLE attributes (
  id          BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  name        VARCHAR(100) NOT NULL,
  input_type  ENUM('text','number','single_select','multi_select') NOT NULL DEFAULT 'text',
  PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE attribute_options (
  id           BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  attribute_id BIGINT UNSIGNED NOT NULL,
  value        VARCHAR(100) NOT NULL,
  PRIMARY KEY (id),
  KEY idx_attropt_attr (attribute_id),
  CONSTRAINT fk_attropt_attr FOREIGN KEY (attribute_id) REFERENCES attributes(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Danh mục nào yêu cầu thuộc tính nào
CREATE TABLE category_attributes (
  category_id  BIGINT UNSIGNED NOT NULL,
  attribute_id BIGINT UNSIGNED NOT NULL,
  is_required  TINYINT(1) NOT NULL DEFAULT 0,
  position     INT NOT NULL DEFAULT 0,
  PRIMARY KEY (category_id, attribute_id),
  CONSTRAINT fk_catattr_cat  FOREIGN KEY (category_id)  REFERENCES categories(id) ON DELETE CASCADE,
  CONSTRAINT fk_catattr_attr FOREIGN KEY (attribute_id) REFERENCES attributes(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- =====================================================================
-- 4. SẢN PHẨM (ITEM)
-- =====================================================================

CREATE TABLE products (
  id            BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  shop_id       BIGINT UNSIGNED NOT NULL,
  category_id   BIGINT UNSIGNED NOT NULL,        -- phải là danh mục lá
  shop_category_id BIGINT UNSIGNED NULL,
  brand_id      BIGINT UNSIGNED NULL,
  name          VARCHAR(255) NOT NULL,
  slug          VARCHAR(300) NOT NULL,
  description   MEDIUMTEXT NULL,
  condition_type ENUM('new','used') NOT NULL DEFAULT 'new',
  weight_gram   INT UNSIGNED NOT NULL DEFAULT 0, -- dùng tính phí ship
  length_cm     DECIMAL(6,1) NULL,
  width_cm      DECIMAL(6,1) NULL,
  height_cm     DECIMAL(6,1) NULL,
  video_url     VARCHAR(500) NULL,
  has_variants  TINYINT(1) NOT NULL DEFAULT 0,   -- 0: sản phẩm đơn (vẫn có 1 model mặc định)
  status        ENUM('draft','active','hidden','banned','deleted') NOT NULL DEFAULT 'draft',
  preorder_days TINYINT UNSIGNED NULL,           -- hàng đặt trước

  -- Các cột "phi chuẩn hóa" để danh sách tải nhanh, cập nhật bằng job/trigger
  min_price     BIGINT UNSIGNED NOT NULL DEFAULT 0,  -- giá thấp nhất trong các model
  max_price     BIGINT UNSIGNED NOT NULL DEFAULT 0,
  total_stock   INT UNSIGNED NOT NULL DEFAULT 0,
  sold_count    INT UNSIGNED NOT NULL DEFAULT 0,
  view_count    INT UNSIGNED NOT NULL DEFAULT 0,
  like_count    INT UNSIGNED NOT NULL DEFAULT 0,
  rating_avg    DECIMAL(3,2) NOT NULL DEFAULT 0.00,
  rating_count  INT UNSIGNED NOT NULL DEFAULT 0,

  created_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at    DATETIME NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_products_slug (slug),
  KEY idx_products_shop (shop_id, status),
  KEY idx_products_category (category_id, status),
  KEY idx_products_sold (sold_count),
  KEY idx_products_price (min_price),
  FULLTEXT KEY ft_products_name (name),
  CONSTRAINT fk_products_shop     FOREIGN KEY (shop_id)     REFERENCES shops(id),
  CONSTRAINT fk_products_category FOREIGN KEY (category_id) REFERENCES categories(id),
  CONSTRAINT fk_products_shopcat  FOREIGN KEY (shop_category_id) REFERENCES shop_categories(id) ON DELETE SET NULL,
  CONSTRAINT fk_products_brand    FOREIGN KEY (brand_id)    REFERENCES brands(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE product_images (
  id         BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  product_id BIGINT UNSIGNED NOT NULL,
  url        VARCHAR(500) NOT NULL,
  position   TINYINT UNSIGNED NOT NULL DEFAULT 0,  -- position 0 = ảnh bìa
  PRIMARY KEY (id),
  KEY idx_pimg_product (product_id, position),
  CONSTRAINT fk_pimg_product FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Giá trị thuộc tính mô tả của từng sản phẩm
CREATE TABLE product_attribute_values (
  id           BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  product_id   BIGINT UNSIGNED NOT NULL,
  attribute_id BIGINT UNSIGNED NOT NULL,
  option_id    BIGINT UNSIGNED NULL,               -- khi chọn từ danh sách
  value_text   VARCHAR(255) NULL,                  -- khi nhập tay
  PRIMARY KEY (id),
  KEY idx_pav_product (product_id),
  KEY idx_pav_attr (attribute_id, option_id),
  CONSTRAINT fk_pav_product FOREIGN KEY (product_id)   REFERENCES products(id) ON DELETE CASCADE,
  CONSTRAINT fk_pav_attr    FOREIGN KEY (attribute_id) REFERENCES attributes(id),
  CONSTRAINT fk_pav_option  FOREIGN KEY (option_id)    REFERENCES attribute_options(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- =====================================================================
-- 5. PHÂN LOẠI HÀNG (TIER) & BIẾN THỂ (MODEL / SKU)
-- Giống Shopee: tối đa 2 nhóm phân loại (vd Màu, Size).
-- =====================================================================

-- Nhóm phân loại của sản phẩm: "Màu sắc", "Kích cỡ"
CREATE TABLE product_tiers (
  id         BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  product_id BIGINT UNSIGNED NOT NULL,
  name       VARCHAR(30) NOT NULL,
  position   TINYINT UNSIGNED NOT NULL,            -- 1 hoặc 2
  PRIMARY KEY (id),
  UNIQUE KEY uq_tier_product_pos (product_id, position),
  CONSTRAINT fk_tier_product FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
  CONSTRAINT ck_tier_pos CHECK (position IN (1, 2))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Lựa chọn trong từng nhóm: Đen, Trắng / S, M, L
CREATE TABLE tier_options (
  id         BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  tier_id    BIGINT UNSIGNED NOT NULL,
  value      VARCHAR(50) NOT NULL,
  image_url  VARCHAR(500) NULL,                    -- ảnh theo lựa chọn (thường dùng cho màu)
  position   TINYINT UNSIGNED NOT NULL DEFAULT 0,
  PRIMARY KEY (id),
  UNIQUE KEY uq_tieropt_value (tier_id, value),
  CONSTRAINT fk_tieropt_tier FOREIGN KEY (tier_id) REFERENCES product_tiers(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Biến thể bán được (SKU). Giá và tồn kho nằm ở đây.
-- Sản phẩm không có phân loại vẫn có đúng 1 model mặc định.
CREATE TABLE product_models (
  id             BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  product_id     BIGINT UNSIGNED NOT NULL,
  sku            VARCHAR(100) NULL,                -- mã do shop tự đặt
  name           VARCHAR(100) NULL,                -- vd 'Đen, M' (lưu sẵn để hiển thị)
  option_key     VARCHAR(100) NOT NULL DEFAULT '', -- vd '12-15' (id option đã sắp xếp) để chống trùng tổ hợp
  original_price BIGINT UNSIGNED NOT NULL,         -- giá gốc
  price          BIGINT UNSIGNED NOT NULL,         -- giá bán hiện hành (sau giảm của shop)
  image_url      VARCHAR(500) NULL,
  status         ENUM('active','hidden','deleted') NOT NULL DEFAULT 'active',
  created_at     TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at     TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_models_combo (product_id, option_key),   -- không có 2 biến thể "Đen M"
  UNIQUE KEY uq_models_sku (product_id, sku),
  CONSTRAINT fk_models_product FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
  CONSTRAINT ck_models_price CHECK (price <= original_price)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Biến thể gồm những lựa chọn nào (tối đa 2 dòng cho mỗi model)
CREATE TABLE model_tier_options (
  model_id       BIGINT UNSIGNED NOT NULL,
  tier_option_id BIGINT UNSIGNED NOT NULL,
  PRIMARY KEY (model_id, tier_option_id),
  KEY idx_mto_option (tier_option_id),
  CONSTRAINT fk_mto_model  FOREIGN KEY (model_id)       REFERENCES product_models(id) ON DELETE CASCADE,
  CONSTRAINT fk_mto_option FOREIGN KEY (tier_option_id) REFERENCES tier_options(id)  ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- =====================================================================
-- 6. TỒN KHO
-- Tách khỏi product_models để khóa dòng khi trừ kho, hạn chế tranh chấp.
-- =====================================================================

CREATE TABLE inventories (
  model_id        BIGINT UNSIGNED NOT NULL,
  stock           INT UNSIGNED NOT NULL DEFAULT 0,   -- tổng tồn thực tế
  reserved_stock  INT UNSIGNED NOT NULL DEFAULT 0,   -- đang giữ cho đơn chưa thanh toán
  updated_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (model_id),
  CONSTRAINT fk_inv_model FOREIGN KEY (model_id) REFERENCES product_models(id) ON DELETE CASCADE,
  CONSTRAINT ck_inv_reserved CHECK (reserved_stock <= stock)
  -- Số lượng còn bán được = stock - reserved_stock
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Nhật ký mọi biến động tồn kho (phục vụ đối soát, tìm lỗi lệch kho)
CREATE TABLE inventory_logs (
  id          BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  model_id    BIGINT UNSIGNED NOT NULL,
  change_type ENUM('restock','sale','reserve','release','cancel','return','adjust') NOT NULL,
  quantity    INT NOT NULL,                          -- dương: tăng, âm: giảm
  stock_after INT UNSIGNED NOT NULL,
  order_id    BIGINT UNSIGNED NULL,
  note        VARCHAR(255) NULL,
  created_by  BIGINT UNSIGNED NULL,
  created_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_invlog_model (model_id, created_at),
  CONSTRAINT fk_invlog_model FOREIGN KEY (model_id) REFERENCES product_models(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- =====================================================================
-- 7. GIỎ HÀNG & WISHLIST
-- =====================================================================

CREATE TABLE cart_items (
  id         BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id    BIGINT UNSIGNED NOT NULL,
  shop_id    BIGINT UNSIGNED NOT NULL,               -- để nhóm giỏ hàng theo shop
  model_id   BIGINT UNSIGNED NOT NULL,               -- giỏ hàng trỏ vào biến thể, không phải sản phẩm
  quantity   INT UNSIGNED NOT NULL DEFAULT 1,
  selected   TINYINT(1) NOT NULL DEFAULT 1,          -- đã tick chọn để thanh toán
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_cart_user_model (user_id, model_id), -- thêm lại thì cộng dồn quantity
  KEY idx_cart_shop (user_id, shop_id),
  CONSTRAINT fk_cart_user  FOREIGN KEY (user_id)  REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_cart_shop  FOREIGN KEY (shop_id)  REFERENCES shops(id),
  CONSTRAINT fk_cart_model FOREIGN KEY (model_id) REFERENCES product_models(id) ON DELETE CASCADE,
  CONSTRAINT ck_cart_qty CHECK (quantity > 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE wishlists (
  user_id    BIGINT UNSIGNED NOT NULL,
  product_id BIGINT UNSIGNED NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id, product_id),
  KEY idx_wish_product (product_id),
  CONSTRAINT fk_wish_user    FOREIGN KEY (user_id)    REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_wish_product FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- =====================================================================
-- 8. VOUCHER & FLASH SALE
-- =====================================================================

CREATE TABLE vouchers (
  id              BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  shop_id         BIGINT UNSIGNED NULL,              -- NULL = voucher của sàn
  code            VARCHAR(30) NOT NULL,
  name            VARCHAR(150) NOT NULL,
  discount_type   ENUM('fixed','percent') NOT NULL,
  discount_value  BIGINT UNSIGNED NOT NULL,          -- số tiền hoặc % (1-100)
  max_discount    BIGINT UNSIGNED NULL,              -- trần giảm khi dùng %
  min_order_value BIGINT UNSIGNED NOT NULL DEFAULT 0,
  total_quantity  INT UNSIGNED NOT NULL,             -- tổng lượt phát hành
  used_quantity   INT UNSIGNED NOT NULL DEFAULT 0,
  per_user_limit  TINYINT UNSIGNED NOT NULL DEFAULT 1,
  applies_to      ENUM('all','products','categories') NOT NULL DEFAULT 'all',
  start_at        DATETIME NOT NULL,
  end_at          DATETIME NOT NULL,
  status          ENUM('draft','active','ended','disabled') NOT NULL DEFAULT 'draft',
  created_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_vouchers_code (code),
  KEY idx_vouchers_shop (shop_id),
  KEY idx_vouchers_time (start_at, end_at),
  CONSTRAINT fk_vouchers_shop FOREIGN KEY (shop_id) REFERENCES shops(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Phạm vi áp dụng khi applies_to <> 'all'
CREATE TABLE voucher_scopes (
  id           BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  voucher_id   BIGINT UNSIGNED NOT NULL,
  product_id   BIGINT UNSIGNED NULL,
  category_id  BIGINT UNSIGNED NULL,
  PRIMARY KEY (id),
  KEY idx_vscope_voucher (voucher_id),
  CONSTRAINT fk_vscope_voucher FOREIGN KEY (voucher_id) REFERENCES vouchers(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Voucher người dùng đã lưu / đã dùng
CREATE TABLE user_vouchers (
  id          BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id     BIGINT UNSIGNED NOT NULL,
  voucher_id  BIGINT UNSIGNED NOT NULL,
  order_id    BIGINT UNSIGNED NULL,                  -- có giá trị khi đã dùng
  saved_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  used_at     DATETIME NULL,
  PRIMARY KEY (id),
  KEY idx_uv_user (user_id, voucher_id),
  CONSTRAINT fk_uv_user    FOREIGN KEY (user_id)    REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_uv_voucher FOREIGN KEY (voucher_id) REFERENCES vouchers(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE flash_sales (
  id       BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  name     VARCHAR(150) NOT NULL,
  start_at DATETIME NOT NULL,
  end_at   DATETIME NOT NULL,
  status   ENUM('scheduled','running','ended','cancelled') NOT NULL DEFAULT 'scheduled',
  PRIMARY KEY (id),
  KEY idx_fs_time (start_at, end_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Giá khuyến mãi tách riêng, KHÔNG ghi đè giá gốc của model
CREATE TABLE flash_sale_items (
  id             BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  flash_sale_id  BIGINT UNSIGNED NOT NULL,
  model_id       BIGINT UNSIGNED NOT NULL,
  sale_price     BIGINT UNSIGNED NOT NULL,
  sale_stock     INT UNSIGNED NOT NULL,              -- số lượng dành riêng cho đợt sale
  sold_count     INT UNSIGNED NOT NULL DEFAULT 0,
  per_user_limit TINYINT UNSIGNED NOT NULL DEFAULT 1,
  PRIMARY KEY (id),
  UNIQUE KEY uq_fsi (flash_sale_id, model_id),
  CONSTRAINT fk_fsi_sale  FOREIGN KEY (flash_sale_id) REFERENCES flash_sales(id) ON DELETE CASCADE,
  CONSTRAINT fk_fsi_model FOREIGN KEY (model_id)      REFERENCES product_models(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- =====================================================================
-- 9. ĐƠN HÀNG
-- Một lần thanh toán (checkout) có thể gồm nhiều sản phẩm của nhiều shop.
-- Hệ thống tách thành mỗi shop một đơn (orders).
-- =====================================================================

CREATE TABLE checkouts (
  id                BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  checkout_code     VARCHAR(30) NOT NULL,
  user_id           BIGINT UNSIGNED NOT NULL,
  subtotal          BIGINT UNSIGNED NOT NULL,        -- tổng tiền hàng
  shipping_total    BIGINT UNSIGNED NOT NULL DEFAULT 0,
  discount_total    BIGINT UNSIGNED NOT NULL DEFAULT 0,
  grand_total       BIGINT UNSIGNED NOT NULL,        -- khách phải trả
  payment_method    ENUM('cod','bank_transfer','card','ewallet') NOT NULL,
  payment_status    ENUM('unpaid','paid','failed','refunded') NOT NULL DEFAULT 'unpaid',
  expires_at        DATETIME NULL,                   -- quá hạn mà chưa trả thì hủy và nhả hàng giữ
  created_at        TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_checkouts_code (checkout_code),
  KEY idx_checkouts_user (user_id, created_at),
  CONSTRAINT fk_checkouts_user FOREIGN KEY (user_id) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE orders (
  id                 BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  order_code         VARCHAR(30) NOT NULL,           -- mã hiển thị cho khách
  checkout_id        BIGINT UNSIGNED NOT NULL,
  user_id            BIGINT UNSIGNED NOT NULL,
  shop_id            BIGINT UNSIGNED NOT NULL,

  status ENUM(
    'pending_payment',   -- chờ thanh toán
    'to_ship',           -- chờ lấy hàng / chờ giao
    'shipping',          -- đang giao
    'delivered',         -- đã giao
    'completed',         -- hoàn thành (khách xác nhận hoặc quá hạn)
    'cancelled',         -- đã hủy
    'return_refund'      -- trả hàng / hoàn tiền
  ) NOT NULL DEFAULT 'pending_payment',

  -- Ảnh chụp địa chỉ tại thời điểm đặt (không trỏ sổ địa chỉ vì khách có thể sửa/xóa sau)
  receiver_name      VARCHAR(100) NOT NULL,
  receiver_phone     VARCHAR(20)  NOT NULL,
  shipping_address   VARCHAR(500) NOT NULL,
  province_id        INT UNSIGNED NULL,
  district_id        INT UNSIGNED NULL,
  ward_id            INT UNSIGNED NULL,

  subtotal           BIGINT UNSIGNED NOT NULL,       -- tiền hàng của shop này
  shipping_fee       BIGINT UNSIGNED NOT NULL DEFAULT 0,
  shop_voucher_discount   BIGINT UNSIGNED NOT NULL DEFAULT 0,
  platform_voucher_discount BIGINT UNSIGNED NOT NULL DEFAULT 0,
  total_amount       BIGINT UNSIGNED NOT NULL,       -- subtotal + shipping - giảm giá
  buyer_note         VARCHAR(500) NULL,
  cancel_reason      VARCHAR(255) NULL,
  cancelled_by       ENUM('buyer','seller','system') NULL,

  paid_at            DATETIME NULL,
  shipped_at         DATETIME NULL,
  delivered_at       DATETIME NULL,
  completed_at       DATETIME NULL,
  cancelled_at       DATETIME NULL,
  created_at         TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at         TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_orders_code (order_code),
  KEY idx_orders_user (user_id, status, created_at),
  KEY idx_orders_shop (shop_id, status, created_at),
  KEY idx_orders_checkout (checkout_id),
  CONSTRAINT fk_orders_checkout FOREIGN KEY (checkout_id) REFERENCES checkouts(id),
  CONSTRAINT fk_orders_user     FOREIGN KEY (user_id)     REFERENCES users(id),
  CONSTRAINT fk_orders_shop     FOREIGN KEY (shop_id)     REFERENCES shops(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Dòng hàng trong đơn. QUAN TRỌNG: lưu "ảnh chụp" tên, giá, biến thể tại thời điểm mua,
-- vì sản phẩm có thể bị sửa giá, đổi tên hoặc xóa sau này.
CREATE TABLE order_items (
  id              BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  order_id        BIGINT UNSIGNED NOT NULL,
  product_id      BIGINT UNSIGNED NULL,              -- để tham chiếu, có thể NULL nếu sản phẩm bị xóa cứng
  model_id        BIGINT UNSIGNED NULL,
  product_name    VARCHAR(255) NOT NULL,             -- snapshot
  model_name      VARCHAR(100) NULL,                 -- snapshot, vd 'Đen, M'
  sku             VARCHAR(100) NULL,
  image_url       VARCHAR(500) NULL,
  unit_price      BIGINT UNSIGNED NOT NULL,          -- giá thực tế khách trả cho 1 sản phẩm
  original_price  BIGINT UNSIGNED NOT NULL,          -- giá gốc lúc đó (để hiện giá gạch)
  quantity        INT UNSIGNED NOT NULL,
  line_total      BIGINT UNSIGNED NOT NULL,          -- unit_price * quantity
  flash_sale_item_id BIGINT UNSIGNED NULL,
  is_reviewed     TINYINT(1) NOT NULL DEFAULT 0,
  PRIMARY KEY (id),
  KEY idx_oi_order (order_id),
  KEY idx_oi_product (product_id),
  KEY idx_oi_model (model_id),
  CONSTRAINT fk_oi_order   FOREIGN KEY (order_id)   REFERENCES orders(id) ON DELETE CASCADE,
  CONSTRAINT fk_oi_product FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE SET NULL,
  CONSTRAINT fk_oi_model   FOREIGN KEY (model_id)   REFERENCES product_models(id) ON DELETE SET NULL,
  CONSTRAINT ck_oi_qty CHECK (quantity > 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Lịch sử đổi trạng thái đơn (hiển thị timeline cho khách)
CREATE TABLE order_status_history (
  id          BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  order_id    BIGINT UNSIGNED NOT NULL,
  from_status VARCHAR(30) NULL,
  to_status   VARCHAR(30) NOT NULL,
  note        VARCHAR(255) NULL,
  actor_type  ENUM('buyer','seller','admin','system') NOT NULL,
  actor_id    BIGINT UNSIGNED NULL,
  created_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_osh_order (order_id, created_at),
  CONSTRAINT fk_osh_order FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Voucher đã áp vào đơn (1 đơn có thể có voucher shop + voucher sàn)
CREATE TABLE order_vouchers (
  id              BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  order_id        BIGINT UNSIGNED NOT NULL,
  voucher_id      BIGINT UNSIGNED NOT NULL,
  voucher_code    VARCHAR(30) NOT NULL,              -- snapshot
  discount_amount BIGINT UNSIGNED NOT NULL,
  PRIMARY KEY (id),
  KEY idx_ov_order (order_id),
  CONSTRAINT fk_ov_order   FOREIGN KEY (order_id)   REFERENCES orders(id) ON DELETE CASCADE,
  CONSTRAINT fk_ov_voucher FOREIGN KEY (voucher_id) REFERENCES vouchers(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- =====================================================================
-- 10. THANH TOÁN
-- =====================================================================

CREATE TABLE payments (
  id             BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  checkout_id    BIGINT UNSIGNED NOT NULL,
  method         ENUM('cod','bank_transfer','card','ewallet') NOT NULL,
  provider       VARCHAR(30) NULL,                   -- vd 'momo', 'vnpay', 'zalopay'
  amount         BIGINT UNSIGNED NOT NULL,
  status         ENUM('pending','success','failed','refunded','partial_refunded') NOT NULL DEFAULT 'pending',
  provider_txn_id VARCHAR(100) NULL,                 -- mã giao dịch phía cổng thanh toán
  raw_response   JSON NULL,                          -- lưu phản hồi gốc để đối soát
  paid_at        DATETIME NULL,
  created_at     TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_payments_provider_txn (provider, provider_txn_id),  -- chống xử lý trùng callback
  KEY idx_payments_checkout (checkout_id),
  CONSTRAINT fk_payments_checkout FOREIGN KEY (checkout_id) REFERENCES checkouts(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Ví của người dùng và người bán (tiền hoàn, tiền bán hàng chờ rút)
CREATE TABLE wallets (
  user_id    BIGINT UNSIGNED NOT NULL,
  balance    BIGINT UNSIGNED NOT NULL DEFAULT 0,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id),
  CONSTRAINT fk_wallets_user FOREIGN KEY (user_id) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE wallet_transactions (
  id            BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id       BIGINT UNSIGNED NOT NULL,
  type          ENUM('refund','order_income','withdraw','payment','adjust') NOT NULL,
  amount        BIGINT NOT NULL,                     -- dương: cộng, âm: trừ
  balance_after BIGINT UNSIGNED NOT NULL,
  order_id      BIGINT UNSIGNED NULL,
  note          VARCHAR(255) NULL,
  created_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_wtx_user (user_id, created_at),
  CONSTRAINT fk_wtx_user FOREIGN KEY (user_id) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- =====================================================================
-- 11. VẬN CHUYỂN
-- =====================================================================

CREATE TABLE shipping_carriers (
  id     INT UNSIGNED NOT NULL AUTO_INCREMENT,
  code   VARCHAR(30) NOT NULL,                       -- 'ghn', 'ghtk', 'spx'
  name   VARCHAR(100) NOT NULL,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  PRIMARY KEY (id),
  UNIQUE KEY uq_carriers_code (code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE shipments (
  id              BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  order_id        BIGINT UNSIGNED NOT NULL,
  carrier_id      INT UNSIGNED NOT NULL,
  tracking_number VARCHAR(50) NULL,
  status          ENUM('created','picked_up','in_transit','out_for_delivery','delivered','failed','returned') NOT NULL DEFAULT 'created',
  shipping_fee    BIGINT UNSIGNED NOT NULL DEFAULT 0,
  cod_amount      BIGINT UNSIGNED NOT NULL DEFAULT 0,  -- tiền thu hộ
  estimated_delivery_at DATETIME NULL,
  picked_up_at    DATETIME NULL,
  delivered_at    DATETIME NULL,
  created_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_shipments_order (order_id),
  UNIQUE KEY uq_shipments_tracking (carrier_id, tracking_number),
  CONSTRAINT fk_shipments_order   FOREIGN KEY (order_id)   REFERENCES orders(id),
  CONSTRAINT fk_shipments_carrier FOREIGN KEY (carrier_id) REFERENCES shipping_carriers(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Các mốc hành trình (hiển thị "Đã đến bưu cục ...")
CREATE TABLE shipment_events (
  id          BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  shipment_id BIGINT UNSIGNED NOT NULL,
  status      VARCHAR(30) NOT NULL,
  description VARCHAR(255) NOT NULL,
  location    VARCHAR(255) NULL,
  occurred_at DATETIME NOT NULL,
  PRIMARY KEY (id),
  KEY idx_sevent_shipment (shipment_id, occurred_at),
  CONSTRAINT fk_sevent_shipment FOREIGN KEY (shipment_id) REFERENCES shipments(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- =====================================================================
-- 12. TRẢ HÀNG / HOÀN TIỀN
-- =====================================================================

CREATE TABLE order_returns (
  id            BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  order_id      BIGINT UNSIGNED NOT NULL,
  user_id       BIGINT UNSIGNED NOT NULL,
  reason        ENUM('not_received','wrong_item','damaged','not_as_described','other') NOT NULL,
  description   VARCHAR(1000) NULL,
  refund_amount BIGINT UNSIGNED NOT NULL,
  status        ENUM('requested','seller_rejected','approved','returning','refunded','closed') NOT NULL DEFAULT 'requested',
  created_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_returns_order (order_id),
  CONSTRAINT fk_returns_order FOREIGN KEY (order_id) REFERENCES orders(id),
  CONSTRAINT fk_returns_user  FOREIGN KEY (user_id)  REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE order_return_items (
  id              BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  return_id       BIGINT UNSIGNED NOT NULL,
  order_item_id   BIGINT UNSIGNED NOT NULL,
  quantity        INT UNSIGNED NOT NULL,
  PRIMARY KEY (id),
  CONSTRAINT fk_ritem_return FOREIGN KEY (return_id)     REFERENCES order_returns(id) ON DELETE CASCADE,
  CONSTRAINT fk_ritem_item   FOREIGN KEY (order_item_id) REFERENCES order_items(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE order_return_media (
  id        BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  return_id BIGINT UNSIGNED NOT NULL,
  url       VARCHAR(500) NOT NULL,
  media_type ENUM('image','video') NOT NULL DEFAULT 'image',
  PRIMARY KEY (id),
  CONSTRAINT fk_rmedia_return FOREIGN KEY (return_id) REFERENCES order_returns(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- =====================================================================
-- 13. ĐÁNH GIÁ
-- Mỗi dòng hàng (order_item) chỉ được đánh giá 1 lần => chỉ người đã mua mới đánh giá.
-- =====================================================================

CREATE TABLE reviews (
  id             BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  order_item_id  BIGINT UNSIGNED NOT NULL,
  product_id     BIGINT UNSIGNED NOT NULL,
  model_id       BIGINT UNSIGNED NULL,
  shop_id        BIGINT UNSIGNED NOT NULL,
  user_id        BIGINT UNSIGNED NOT NULL,
  rating         TINYINT UNSIGNED NOT NULL,          -- 1..5
  content        VARCHAR(2000) NULL,
  is_anonymous   TINYINT(1) NOT NULL DEFAULT 0,
  like_count     INT UNSIGNED NOT NULL DEFAULT 0,
  status         ENUM('visible','hidden','deleted') NOT NULL DEFAULT 'visible',
  created_at     TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_reviews_order_item (order_item_id),
  KEY idx_reviews_product (product_id, status, rating, created_at),
  KEY idx_reviews_user (user_id),
  CONSTRAINT fk_reviews_item    FOREIGN KEY (order_item_id) REFERENCES order_items(id),
  CONSTRAINT fk_reviews_product FOREIGN KEY (product_id)    REFERENCES products(id),
  CONSTRAINT fk_reviews_shop    FOREIGN KEY (shop_id)       REFERENCES shops(id),
  CONSTRAINT fk_reviews_user    FOREIGN KEY (user_id)       REFERENCES users(id),
  CONSTRAINT ck_reviews_rating CHECK (rating BETWEEN 1 AND 5)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE review_media (
  id         BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  review_id  BIGINT UNSIGNED NOT NULL,
  url        VARCHAR(500) NOT NULL,
  media_type ENUM('image','video') NOT NULL DEFAULT 'image',
  PRIMARY KEY (id),
  KEY idx_rmedia_review (review_id),
  CONSTRAINT fk_rmedia_review FOREIGN KEY (review_id) REFERENCES reviews(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Phản hồi của shop cho đánh giá
CREATE TABLE review_replies (
  id         BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  review_id  BIGINT UNSIGNED NOT NULL,
  shop_id    BIGINT UNSIGNED NOT NULL,
  content    VARCHAR(1000) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_rreply_review (review_id),
  CONSTRAINT fk_rreply_review FOREIGN KEY (review_id) REFERENCES reviews(id) ON DELETE CASCADE,
  CONSTRAINT fk_rreply_shop   FOREIGN KEY (shop_id)   REFERENCES shops(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- =====================================================================
-- 14. THÔNG BÁO
-- =====================================================================

CREATE TABLE notifications (
  id         BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id    BIGINT UNSIGNED NOT NULL,
  type       ENUM('order','promotion','system','chat') NOT NULL,
  title      VARCHAR(150) NOT NULL,
  body       VARCHAR(500) NULL,
  link       VARCHAR(255) NULL,                      -- đường dẫn mở khi bấm
  is_read    TINYINT(1) NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_notif_user (user_id, is_read, created_at),
  CONSTRAINT fk_notif_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

SET FOREIGN_KEY_CHECKS = 1;

-- =====================================================================
-- PHỤ LỤC A: TRUY VẤN MẪU
-- =====================================================================

-- A1. Trang chi tiết: danh sách biến thể + giá + tồn kho khả dụng
-- SELECT m.id, m.name, m.price, m.original_price,
--        (i.stock - i.reserved_stock) AS available
-- FROM product_models m
-- JOIN inventories i ON i.model_id = m.id
-- WHERE m.product_id = ? AND m.status = 'active';

-- A2. Giữ hàng an toàn khi đặt (tránh bán lố): 1 câu lệnh nguyên tử, kiểm tra affected rows
-- UPDATE inventories
-- SET reserved_stock = reserved_stock + ?
-- WHERE model_id = ? AND (stock - reserved_stock) >= ?;
-- -- affected rows = 0  =>  hết hàng, hủy giao dịch

-- A3. Khi thanh toán thành công: chuyển từ "giữ" sang "đã bán"
-- UPDATE inventories
-- SET stock = stock - ?, reserved_stock = reserved_stock - ?
-- WHERE model_id = ?;

-- A4. Cập nhật khoảng giá hiển thị của sản phẩm
-- UPDATE products p
-- JOIN (SELECT product_id, MIN(price) mn, MAX(price) mx
--       FROM product_models WHERE status='active' GROUP BY product_id) x
--   ON x.product_id = p.id
-- SET p.min_price = x.mn, p.max_price = x.mx
-- WHERE p.id = ?;

-- A5. Cập nhật điểm đánh giá trung bình của sản phẩm
-- UPDATE products p
-- JOIN (SELECT product_id, AVG(rating) a, COUNT(*) c
--       FROM reviews WHERE status='visible' GROUP BY product_id) r
--   ON r.product_id = p.id
-- SET p.rating_avg = r.a, p.rating_count = r.c
-- WHERE p.id = ?;

-- =====================================================================
-- PHỤ LỤC B: LƯU Ý KHI TRIỂN KHAI
-- =====================================================================
-- 1. Đặt hàng phải nằm trong TRANSACTION: tạo checkout, orders, order_items,
--    giữ hàng (reserved_stock), ghi inventory_logs, xóa cart_items đã chọn.
-- 2. Cần job định kỳ: hủy checkout quá hạn (expires_at) và nhả reserved_stock.
-- 3. Callback cổng thanh toán phải idempotent (dựa vào uq_payments_provider_txn).
-- 4. order_items luôn lưu snapshot giá/tên, không JOIN ngược để lấy giá lịch sử.
-- 5. Các cột phi chuẩn hóa (min_price, sold_count, rating_avg...) cập nhật bằng
--    job hoặc ngay trong transaction liên quan; không tính lại mỗi lần truy vấn.
-- 6. Tìm kiếm quy mô lớn nên dùng Elasticsearch/OpenSearch thay FULLTEXT của MySQL.
-- 7. Chỉ mục (INDEX) đã đặt theo các truy vấn chính; hãy kiểm tra lại bằng EXPLAIN
--    khi có dữ liệu thật.
