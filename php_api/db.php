<?php
declare(strict_types=1);

function sw_config(): array
{
    return require __DIR__ . '/config.php';
}

function sw_json($data, int $status = 200): void
{
    http_response_code($status);
    header('Content-Type: application/json; charset=utf-8');
    header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');
    echo json_encode($data, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
    exit;
}

function sw_read_json_body(): array
{
    $raw = file_get_contents('php://input');
    if ($raw === false || trim($raw) === '') {
        return [];
    }
    $decoded = json_decode($raw, true);
    return is_array($decoded) ? $decoded : [];
}

function sw_start_session(): void
{
    if (session_status() === PHP_SESSION_ACTIVE) {
        return;
    }
    $isHttps = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off')
        || (isset($_SERVER['HTTP_X_FORWARDED_PROTO']) && stripos($_SERVER['HTTP_X_FORWARDED_PROTO'], 'https') !== false);

    ini_set('session.use_strict_mode', '1');
    session_name('sw_admin_php_session');
    session_set_cookie_params([
        'lifetime' => 60 * 60 * 8,
        'path' => '/',
        'httponly' => true,
        'samesite' => 'Lax',
        'secure' => $isHttps,
    ]);
    session_start();
}

function sw_current_admin(): ?string
{
    sw_start_session();
    if (!empty($_SESSION['sw_admin_user']) && is_string($_SESSION['sw_admin_user'])) {
        return $_SESSION['sw_admin_user'];
    }
    return null;
}

function sw_valid_role(string $role): bool
{
    return in_array($role, ['super_admin', 'manager', 'editor', 'viewer'], true);
}

function sw_current_admin_record(PDO $pdo): ?array
{
    $user = sw_current_admin();
    if ($user === null) {
        return null;
    }
    $stmt = $pdo->prepare('SELECT `id`, `username`, `role`, `is_active` FROM `admins` WHERE `username` = ? LIMIT 1');
    $stmt->execute([$user]);
    $row = $stmt->fetch();
    if (!$row || (int)$row['is_active'] !== 1) {
        $_SESSION = [];
        return null;
    }
    $role = sw_valid_role((string)($row['role'] ?? '')) ? (string)$row['role'] : 'editor';
    $_SESSION['sw_admin_role'] = $role;
    return [
        'id' => (int)$row['id'],
        'username' => (string)$row['username'],
        'role' => $role,
        'is_active' => (int)$row['is_active'],
    ];
}

function sw_require_admin(): string
{
    $user = sw_current_admin();
    if ($user === null) {
        sw_json(['ok' => false, 'error' => 'Admin login required.'], 401);
    }
    return $user;
}

function sw_require_role(PDO $pdo, array $allowedRoles): array
{
    $rec = sw_current_admin_record($pdo);
    if ($rec === null) {
        sw_json(['ok' => false, 'error' => 'Admin login required.'], 401);
    }
    if (!in_array($rec['role'], $allowedRoles, true)) {
        sw_json(['ok' => false, 'error' => 'Insufficient permissions for role: ' . $rec['role']], 403);
    }
    return $rec;
}

function sw_valid_campaign_id(string $id): bool
{
    if (!preg_match('/^[A-Za-z0-9_-]{2,40}$/', $id)) {
        return false;
    }
    $reserved = [
        'api', 'php_api', 'database', 'all-campaigns', 'campaign', 'studio',
        'login', 'dashboard', 'terms', 'policy', 'css', 'js', 'frames', 'assets', '404', 'index'
    ];
    return !in_array(strtolower($id), $reserved, true);
}

function sw_db(): PDO
{
    static $pdo = null;
    if ($pdo instanceof PDO) {
        return $pdo;
    }

    $cfg = sw_config();
    $host = $cfg['db_host'];
    $port = $cfg['db_port'];
    $dbName = preg_replace('/[^A-Za-z0-9_]/', '', (string)$cfg['db_name']) ?: 'socialwaves_db';

    $dsnBase = "mysql:host={$host};port={$port};charset=utf8mb4";
    $opts = [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES => false,
    ];

    $pdo = new PDO($dsnBase, $cfg['db_user'], $cfg['db_pass'], $opts);
    $pdo->exec("CREATE DATABASE IF NOT EXISTS `{$dbName}` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci");
    $pdo->exec("USE `{$dbName}`");

    $pdo->exec("
        CREATE TABLE IF NOT EXISTS `admins` (
          `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
          `username` VARCHAR(64) NOT NULL,
          `password_hash` VARCHAR(255) NOT NULL,
          `role` VARCHAR(32) NOT NULL DEFAULT 'editor',
          `is_active` TINYINT(1) NOT NULL DEFAULT 1,
          `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
          PRIMARY KEY (`id`),
          UNIQUE KEY `uniq_admin_username` (`username`)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    ");

    // Auto-migrate role/status columns on existing admins tables
    $adminRoleCol = $pdo->query("SHOW COLUMNS FROM `admins` LIKE 'role'")->fetch();
    if (!$adminRoleCol) {
        $pdo->exec("ALTER TABLE `admins` ADD COLUMN `role` VARCHAR(32) NOT NULL DEFAULT 'editor' AFTER `password_hash`");
        $pdo->exec("ALTER TABLE `admins` ADD COLUMN `is_active` TINYINT(1) NOT NULL DEFAULT 1 AFTER `role`");
        $pdo->exec("UPDATE `admins` SET `role` = 'super_admin' WHERE `username` = 'admin' OR `id` = 1");
    }

    $pdo->exec("
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
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    ");

    // Auto-migrate schedule columns if upgrading an existing database
    $colCheck = $pdo->query("SHOW COLUMNS FROM `campaigns` LIKE 'start_date'")->fetch();
    if (!$colCheck) {
        $pdo->exec("ALTER TABLE `campaigns` ADD COLUMN `start_date` VARCHAR(20) NOT NULL DEFAULT '' AFTER `text_slots_json`");
        $pdo->exec("ALTER TABLE `campaigns` ADD COLUMN `end_date` VARCHAR(20) NOT NULL DEFAULT '' AFTER `start_date`");
        $pdo->exec("ALTER TABLE `campaigns` ADD COLUMN `validity_days` INT UNSIGNED NOT NULL DEFAULT 0 AFTER `end_date`");
    }

    $pdo->exec("
        CREATE TABLE IF NOT EXISTS `campaign_metrics` (
          `campaign_id` VARCHAR(40) NOT NULL,
          `clicks` BIGINT UNSIGNED NOT NULL DEFAULT 0,
          `posters` BIGINT UNSIGNED NOT NULL DEFAULT 0,
          `downloads` BIGINT UNSIGNED NOT NULL DEFAULT 0,
          `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          PRIMARY KEY (`campaign_id`)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    ");

    $pdo->exec("
        CREATE TABLE IF NOT EXISTS `posters` (
          `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
          `campaign_id` VARCHAR(40) NOT NULL,
          `supporter_name` VARCHAR(191) NOT NULL DEFAULT '',
          `form_values_json` TEXT NULL,
          `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
          PRIMARY KEY (`id`),
          KEY `idx_posters_campaign` (`campaign_id`)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    ");

    return $pdo;
}
