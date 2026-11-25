-- SocialWaves Standalone - MySQL Schema
-- Automatically initialized and migrated on first request by php_api/db.php,
-- or import manually into phpMyAdmin.

CREATE DATABASE IF NOT EXISTS `socialwaves_db`
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE `socialwaves_db`;

CREATE TABLE IF NOT EXISTS `admins` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `username` VARCHAR(64) NOT NULL,
  `password_hash` VARCHAR(255) NOT NULL,
  `role` VARCHAR(32) NOT NULL DEFAULT 'editor',
  `is_active` TINYINT(1) NOT NULL DEFAULT 1,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uniq_admin_username` (`username`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `campaigns` (
  `id` VARCHAR(40) NOT NULL,
  `title` VARCHAR(191) NOT NULL,
  `subtitle` VARCHAR(255) NOT NULL DEFAULT '',
  `badge` VARCHAR(100) NOT NULL DEFAULT 'Custom Campaign',
  `frame_id` VARCHAR(64) NOT NULL DEFAULT '',
  `frame_width` INT UNSIGNED NOT NULL DEFAULT 800,
  `frame_height` INT UNSIGNED NOT NULL DEFAULT 1000,
  `crop_width` INT UNSIGNED NOT NULL DEFAULT 260,
  `crop_height` INT UNSIGNED NOT NULL DEFAULT 300,
  `slot_json` LONGTEXT NOT NULL,
  `palette_json` TEXT NOT NULL,
  `header_tag` VARCHAR(191) NOT NULL DEFAULT '',
  `footer_text` VARCHAR(255) NOT NULL DEFAULT '',
  `custom_frame_url` VARCHAR(512) NOT NULL DEFAULT '',
  `fields_json` LONGTEXT NOT NULL,
  `text_slots_json` LONGTEXT NOT NULL,
  `start_date` VARCHAR(20) NOT NULL DEFAULT '',
  `end_date` VARCHAR(20) NOT NULL DEFAULT '',
  `validity_days` INT UNSIGNED NOT NULL DEFAULT 0,
  `created_by` VARCHAR(64) NOT NULL DEFAULT 'admin',
  `updated_at` BIGINT UNSIGNED NOT NULL DEFAULT 0,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_campaigns_updated` (`updated_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `campaign_metrics` (
  `campaign_id` VARCHAR(40) NOT NULL,
  `clicks` BIGINT UNSIGNED NOT NULL DEFAULT 0,
  `posters` BIGINT UNSIGNED NOT NULL DEFAULT 0,
  `downloads` BIGINT UNSIGNED NOT NULL DEFAULT 0,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`campaign_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `posters` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `campaign_id` VARCHAR(40) NOT NULL,
  `supporter_name` VARCHAR(191) NOT NULL DEFAULT '',
  `form_values_json` TEXT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_posters_campaign` (`campaign_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
