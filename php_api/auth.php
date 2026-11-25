<?php
declare(strict_types=1);

require_once __DIR__ . '/db.php';

$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
sw_start_session();

try {
    $pdo = sw_db();
} catch (Throwable $e) {
    sw_json([
        'ok' => false,
        'error' => 'MySQL connection failed: ' . $e->getMessage()
    ], 500);
}

function sw_is_default_password(PDO $pdo, string $username): bool
{
    $stmt = $pdo->prepare('SELECT `password_hash` FROM `admins` WHERE `username` = ? LIMIT 1');
    $stmt->execute([$username]);
    $hash = $stmt->fetchColumn();
    if (!is_string($hash) || $hash === '') {
        return false;
    }
    return password_verify('admin123', $hash);
}

if ($method === 'GET') {
    $user = sw_current_admin();
    $isDefault = $user !== null ? sw_is_default_password($pdo, $user) : false;
    sw_json([
        'ok' => true,
        'engine' => 'php-mysql',
        'authenticated' => $user !== null,
        'username' => $user,
        'usingDefaultPassword' => $isDefault,
    ]);
}

if ($method === 'DELETE') {
    $_SESSION = [];
    if (ini_get('session.use_cookies')) {
        $p = session_get_cookie_params();
        setcookie(session_name(), '', time() - 3600, $p['path'], $p['domain'] ?? '', (bool)$p['secure'], (bool)$p['httponly']);
    }
    session_destroy();
    sw_json(['ok' => true, 'engine' => 'php-mysql', 'authenticated' => false]);
}

if ($method === 'POST') {
    $body = sw_read_json_body();
    $action = (string)($body['action'] ?? 'login');

    if ($action === 'logout') {
        $_SESSION = [];
        session_destroy();
        sw_json(['ok' => true, 'engine' => 'php-mysql', 'authenticated' => false]);
    }

    if ($action === 'change_password') {
        $adminUser = sw_require_admin();
        $curPass = (string)($body['currentPassword'] ?? '');
        $newPass = (string)($body['newPassword'] ?? '');
        if (strlen($newPass) < 6) {
            sw_json(['ok' => false, 'error' => 'New password must be at least 6 characters.'], 400);
        }
        $stmt = $pdo->prepare('SELECT `id`, `password_hash` FROM `admins` WHERE `username` = ? LIMIT 1');
        $stmt->execute([$adminUser]);
        $row = $stmt->fetch();
        if (!$row || !password_verify($curPass, $row['password_hash'])) {
            sw_json(['ok' => false, 'error' => 'Current password is incorrect.'], 401);
        }
        $upd = $pdo->prepare('UPDATE `admins` SET `password_hash` = ? WHERE `id` = ?');
        $upd->execute([password_hash($newPass, PASSWORD_DEFAULT), (int)$row['id']]);
        sw_json(['ok' => true, 'engine' => 'php-mysql', 'message' => 'Admin password updated cleanly.']);
    }

    // Login rate limiting in session
    $failures = (int)($_SESSION['sw_login_failures'] ?? 0);
    $lockedUntil = (int)($_SESSION['sw_login_locked_until'] ?? 0);
    if ($lockedUntil > time()) {
        sw_json(['ok' => false, 'authenticated' => false, 'error' => 'Too many login attempts. Wait a few minutes.'], 429);
    }

    $username = trim((string)($body['username'] ?? ''));
    $password = (string)($body['password'] ?? '');

    $stmt = $pdo->prepare('SELECT `username`, `password_hash` FROM `admins` WHERE `username` = ? LIMIT 1');
    $stmt->execute([$username]);
    $row = $stmt->fetch();

    if (!$row || !password_verify($password, $row['password_hash'])) {
        $failures += 1;
        $_SESSION['sw_login_failures'] = $failures;
        if ($failures >= 8) {
            $_SESSION['sw_login_locked_until'] = time() + 300;
            $_SESSION['sw_login_failures'] = 0;
        }
        sw_json(['ok' => false, 'authenticated' => false, 'error' => 'Invalid username or password.'], 401);
    }

    unset($_SESSION['sw_login_failures'], $_SESSION['sw_login_locked_until']);
    session_regenerate_id(true);
    $_SESSION['sw_admin_user'] = $row['username'];

    sw_json([
        'ok' => true,
        'engine' => 'php-mysql',
        'authenticated' => true,
        'username' => $row['username'],
        'usingDefaultPassword' => password_verify('admin123', $row['password_hash']),
    ]);
}

header('Allow: GET, POST, DELETE');
sw_json(['ok' => false, 'error' => 'Method not allowed'], 405);
