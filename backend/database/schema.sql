-- ==============================================================================
-- SAN Photography - MySQL Database Schema
-- Target Database: san_photography
-- Character Set: utf8mb4
-- Collation: utf8mb4_unicode_ci
-- ==============================================================================

CREATE DATABASE IF NOT EXISTS `san_photography`
  DEFAULT CHARACTER SET utf8mb4
  DEFAULT COLLATE utf8mb4_unicode_ci;

USE `san_photography`;

-- ------------------------------------------------------------------------------
-- 1. Table: admins
-- Purpose: Admin authentication credentials for dashboard management.
-- Corresponds to MongoDB Model: Admin
-- Password will use PHP password_hash() (bcrypt/argon2) compatibility (VARCHAR(255))
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `admins` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `username` VARCHAR(100) NOT NULL,
  `email` VARCHAR(255) NULL DEFAULT NULL,
  `password` VARCHAR(255) NOT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY `idx_admins_username` (`username`),
  UNIQUE KEY `idx_admins_email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `password_reset_tokens` (
  `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `admin_id` INT UNSIGNED NOT NULL,
  `token_hash` CHAR(64) NOT NULL,
  `expires_at` DATETIME NOT NULL,
  `used_at` DATETIME NULL DEFAULT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY `idx_password_reset_admin` (`admin_id`),
  KEY `idx_password_reset_hash` (`token_hash`),
  KEY `idx_password_reset_expiry` (`expires_at`),
  CONSTRAINT `fk_password_reset_admin` FOREIGN KEY (`admin_id`) REFERENCES `admins` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `admin_sessions` (
  `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `admin_id` INT UNSIGNED NOT NULL,
  `token_hash` CHAR(64) NOT NULL,
  `expires_at` DATETIME NOT NULL,
  `revoked_at` DATETIME NULL DEFAULT NULL,
  `last_used_at` DATETIME NULL DEFAULT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY `idx_admin_sessions_token_hash` (`token_hash`),
  CONSTRAINT `fk_admin_sessions_admin` FOREIGN KEY (`admin_id`) REFERENCES `admins` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- 2. Table: website_content
-- Purpose: Flexible content storage for page sections, layout configs, and structured lists.
-- Corresponds to MongoDB Model: Content
-- Nested and polymorphic page objects (home, about, services, portfolio, portfolioPage,
-- gallery, films, blog, contact, serviceList, process, posts) are preserved using JSON columns.
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `website_content` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `home` JSON DEFAULT NULL COMMENT 'Home page hero slides, about blurbs, collage, couple teasers, video section, soulCinema, etc.',
  `about` JSON DEFAULT NULL COMMENT 'About page content, hero, statement, story paragraphs, team members array, philosophy, values, etc.',
  `services` JSON DEFAULT NULL COMMENT 'Services page metadata, intro, headers, and serviceList if nested',
  `portfolio` JSON DEFAULT NULL COMMENT 'Portfolio landing page content, hero video, stories array, CTA',
  `portfolio_page` JSON DEFAULT NULL COMMENT 'Flexible settings for portfolio page layout and details',
  `gallery` JSON DEFAULT NULL COMMENT 'Gallery page intro, hero, couples list with individual photo arrays and tags',
  `films` JSON DEFAULT NULL COMMENT 'Wedding films page data, heroVideoUrl, heroVideoText, statement, and film items array',
  `blog` JSON DEFAULT NULL COMMENT 'Blog page intro, featured story, latest stories, posts array, and CTA',
  `contact` JSON DEFAULT NULL COMMENT 'Contact page intro, details, service options array, FAQ, and map embed link',
  `career` JSON DEFAULT NULL COMMENT 'Career page content and application information',
  `service_list` JSON DEFAULT NULL COMMENT 'Default or custom services list (01 Wedding, 02 Pre-Wedding, etc.)',
  `process` JSON DEFAULT NULL COMMENT 'Process steps array (01 Consultation, 02 Shoot, 03 Delivery)',
  `posts` JSON DEFAULT NULL COMMENT 'Root blog articles and news entries list',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- 3. Table: portfolio_media
-- Purpose: Cloudinary media items linked to specific portfolio positions/slots.
-- Corresponds to MongoDB Model: Portfolio
-- Slots include: hero, cinema, film-1, film-2, story-1...story-4, gallery-1...gallery-8, etc.
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `portfolio_media` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `slot` VARCHAR(100) NOT NULL DEFAULT '' COMMENT 'Unique position identifier (hero, cinema, story-1, etc.)',
  `title` VARCHAR(255) NOT NULL DEFAULT '',
  `image_url` TEXT NOT NULL COMMENT 'Cloudinary media URL',
  `public_id` VARCHAR(255) NOT NULL DEFAULT '' COMMENT 'Cloudinary public_id for updates and deletions',
  `resource_type` VARCHAR(50) NOT NULL DEFAULT '' COMMENT 'image, video, or raw',
  `format` VARCHAR(50) NOT NULL DEFAULT '' COMMENT 'jpg, png, webp, mp4, mov, etc.',
  `width` INT UNSIGNED DEFAULT NULL,
  `height` INT UNSIGNED DEFAULT NULL,
  `bytes` BIGINT UNSIGNED DEFAULT NULL COMMENT 'File size in bytes',
  `folder` VARCHAR(255) NOT NULL DEFAULT 'san-photography/portfolio',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  KEY `idx_portfolio_media_slot` (`slot`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- 4. Table: gallery_media
-- Purpose: Individual gallery media items categorized by couple/event with Cloudinary metadata.
-- Corresponds to MongoDB Model: Gallery
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `gallery_media` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `category` VARCHAR(150) NOT NULL COMMENT 'Event / couple category e.g. Kapil & Payal, Pratik & Megha',
  `title` VARCHAR(255) NOT NULL DEFAULT '',
  `image_url` TEXT NOT NULL COMMENT 'Cloudinary media URL',
  `public_id` VARCHAR(255) NOT NULL DEFAULT '' COMMENT 'Cloudinary public_id for asset management',
  `resource_type` VARCHAR(50) NOT NULL DEFAULT 'image' COMMENT 'image, video, or raw',
  `format` VARCHAR(50) NOT NULL DEFAULT '' COMMENT 'jpg, png, webp, mp4, etc.',
  `width` INT UNSIGNED DEFAULT NULL,
  `height` INT UNSIGNED DEFAULT NULL,
  `bytes` BIGINT UNSIGNED DEFAULT NULL COMMENT 'File size in bytes',
  `folder` VARCHAR(255) NOT NULL DEFAULT 'san-photography/gallery',
  `order` INT NOT NULL DEFAULT 0,
  `is_active` BOOLEAN NOT NULL DEFAULT TRUE,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  KEY `idx_gallery_media_category` (`category`),
  KEY `idx_gallery_media_order` (`order`),
  KEY `idx_gallery_media_is_active` (`is_active`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- 5. Table: sliders
-- Purpose: Homepage and hero slider management with ordering and active toggles.
-- Corresponds to MongoDB Model: Slider
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `sliders` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `title` VARCHAR(255) NOT NULL,
  `subtitle` VARCHAR(255) NOT NULL DEFAULT '',
  `image` TEXT NOT NULL COMMENT 'Cloudinary image URL',
  `public_id` VARCHAR(255) NOT NULL DEFAULT '' COMMENT 'Cloudinary public ID',
  `button_text` VARCHAR(100) NOT NULL DEFAULT '',
  `button_link` VARCHAR(255) NOT NULL DEFAULT '',
  `order` INT NOT NULL DEFAULT 0,
  `is_active` BOOLEAN NOT NULL DEFAULT TRUE,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  KEY `idx_sliders_order` (`order`),
  KEY `idx_sliders_is_active` (`is_active`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- 6. Table: contact_info
-- Purpose: Organization contact details, address, working hours, and maps link.
-- Corresponds to MongoDB Model: ContactInfo
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `contact_info` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `phone` VARCHAR(50) NOT NULL DEFAULT '',
  `email` VARCHAR(150) NOT NULL DEFAULT '',
  `whatsapp` VARCHAR(50) NOT NULL DEFAULT '',
  `address` TEXT DEFAULT NULL,
  `google_maps_url` TEXT DEFAULT NULL,
  `working_hours` VARCHAR(150) NOT NULL DEFAULT '',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- 7. Table: social_media
-- Purpose: Social media links across the site header, footer, and contact sections.
-- Corresponds to MongoDB Model: SocialMedia
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `social_media` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `instagram` VARCHAR(255) NOT NULL DEFAULT '',
  `youtube` VARCHAR(255) NOT NULL DEFAULT '',
  `facebook` VARCHAR(255) NOT NULL DEFAULT '',
  `linkedin` VARCHAR(255) NOT NULL DEFAULT '',
  `twitter` VARCHAR(255) NOT NULL DEFAULT '',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
