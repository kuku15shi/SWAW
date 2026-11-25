<?php
declare(strict_types=1);

require_once __DIR__ . '/db.php';

$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
sw_start_session();

function sw_setup_pdo(?PDO &$pdoOut = null): array
{
    $cfg = sw_config();
    try {
        $pdo = sw_db();
        $pdoOut = $pdo;
        $adminCount = (int)$pdo->query('SELECT COUNT(*) FROM `admins`')->fetchColumn();
        return ['connected' => true, 'adminCount' => $adminCount, 'cfg' => $cfg];
    } catch (Throwable $e) {
        return ['connected' => false, 'adminCount' => 0, 'error' => $e->getMessage(), 'cfg' => $cfg];
    }
}

$pdo = null;
$status = sw_setup_pdo($pdo);

if ($method === 'GET') {
    $currentAdmin = $pdo instanceof PDO ? sw_current_admin_record($pdo) : null;
    $needsSetup = !$status['connected'] || $status['adminCount'] === 0;
    sw_json([
        'ok' => true,
        'connected' => $status['connected'],
        'needsSetup' => $needsSetup,
        'locked' => !$needsSetup && (!$currentAdmin || $currentAdmin['role'] !== 'super_admin'),
        'isSuperAdmin' => $currentAdmin !== null && $currentAdmin['role'] === 'super_admin',
        'config' => [
            'db_host' => $status['cfg']['db_host'],
            'db_port' => $status['cfg']['db_port'],
            'db_name' => $status['cfg']['db_name'],
            'db_user' => $status['cfg']['db_user'],
        ],
        'error' => $status['error'] ?? null,
    ]);
}

if ($method === 'POST') {
    $currentAdmin = $pdo instanceof PDO ? sw_current_admin_record($pdo) : null;
    $needsSetup = !$status['connected'] || $status['adminCount'] === 0;
    if (!$needsSetup && (!$currentAdmin || $currentAdmin['role'] !== 'super_admin')) {
        sw_json(['ok' => false, 'error' => 'Setup is already complete. Sign in as Super Admin to reconfigure MySQL.'], 403);
    }

    $body = sw_read_json_body();
    $action = (string)($body['action'] ?? 'save');

    $dbHost = trim((string)($body['dbHost'] ?? '127.0.0.1'));
    $dbPort = preg_replace('/[^0-9]/', '', (string)($body['dbPort'] ?? '3306')) ?: '3306';
    $dbName = preg_replace('/[^A-Za-z0-9_]/', '', (string)($body['dbName'] ?? 'socialwaves_db')) ?: 'socialwaves_db';
    $dbUser = trim((string)($body['dbUser'] ?? 'root'));
    $dbPass = (string)($body['dbPass'] ?? '');

    if ($dbHost === '' || $dbUser === '') {
        sw_json(['ok' => false, 'error' => 'MySQL Host and DB User are required.'], 400);
    }

    // Test connection with provided credentials
    try {
        $dsn = "mysql:host={$dbHost};port={$dbPort};charset=utf8mb4";
        $testPdo = new PDO($dsn, $dbUser, $dbPass, [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        ]);
        $version = (string)$testPdo->query('SELECT VERSION()')->fetchColumn();
    } catch (Throwable $e) {
        sw_json(['ok' => false, 'error' => 'MySQL connection failed: ' . $e->getMessage()], 400);
    }

    if ($action === 'test') {
        sw_json(['ok' => true, 'message' => 'Connected cleanly to MySQL ' . $version . '!']);
    }

    // Write php_api/config.local.php
    $localPhp = "<?php\nreturn " . var_export([
        'db_host' => $dbHost,
        'db_port' => $dbPort,
        'db_name' => $dbName,
        'db_user' => $dbUser,
        'db_pass' => $dbPass,
    ], true) . ";\n";

    $localPath = __DIR__ . DIRECTORY_SEPARATOR . 'config.local.php';
    if (file_put_contents($localPath, $localPhp) === false) {
        sw_json(['ok' => false, 'error' => 'Unable to write php_api/config.local.php. Check folder permissions.'], 500);
    }

    // Initialize schema using saved config
    try {
        $testPdo->exec("CREATE DATABASE IF NOT EXISTS `{$dbName}` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci");
        $testPdo->exec("USE `{$dbName}`");

        // Run sw_db initialization by executing schema statements via sw_db or fresh PDO
        $freshPdo = sw_db();
        $existingCount = (int)$freshPdo->query('SELECT COUNT(*) FROM `admins`')->fetchColumn();
    } catch (Throwable $e) {
        sw_json(['ok' => false, 'error' => 'Database initialization failed: ' . $e->getMessage()], 500);
    }

    $createdAdmin = null;
    if ($existingCount === 0) {
        $adminUser = trim((string)($body['adminUsername'] ?? ''));
        $adminPass = (string)($body['adminPassword'] ?? '');
        if (!preg_match('/^[A-Za-z0-9_.-]{3,40}$/', $adminUser)) {
            sw_json(['ok' => false, 'error' => 'Initial Super Admin username must be 3-40 letters, numbers, dot, underscore, or dash.'], 400);
        }
        if (strlen($adminPass) < 6) {
            sw_json(['ok' => false, 'error' => 'Super Admin password must be at least 6 characters.'], 400);
        }
        $ins = $freshPdo->prepare('INSERT INTO `admins` (`username`, `password_hash`, `role`, `is_active`) VALUES (?, ?, \'super_admin\', 1)');
        $ins->execute([$adminUser, password_hash($adminPass, PASSWORD_DEFAULT)]);
        $createdAdmin = $adminUser;

        session_regenerate_id(true);
        $_SESSION['sw_admin_user'] = $adminUser;
        $_SESSION['sw_admin_role'] = 'super_admin';
    }

    sw_json([
        'ok' => true,
        'message' => $createdAdmin !== null
            ? 'PHP + MySQL configured and Super Admin "' . $createdAdmin . '" created!'
            : 'MySQL configuration updated and verified cleanly!',
        'createdAdmin' => $createdAdmin,
    ]);
}

header('Allow: GET, POST');
sw_json(['ok' => false, 'error' => 'Method not allowed'], 405);
