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
    $rec = sw_current_admin_record($pdo);
    $action = (string)($_GET['action'] ?? 'session');

    if ($action === 'users') {
        $me = sw_require_role($pdo, ['super_admin']);
        $rows = $pdo->query('SELECT `id`, `username`, `role`, `is_active`, `created_at` FROM `admins` ORDER BY `id` ASC')->fetchAll();
        sw_json([
            'ok' => true,
            'engine' => 'php-mysql',
            'currentUserId' => $me['id'],
            'users' => array_map(static function (array $r): array {
                return [
                    'id' => (int)$r['id'],
                    'username' => (string)$r['username'],
                    'role' => sw_valid_role((string)$r['role']) ? (string)$r['role'] : 'editor',
                    'isActive' => (int)$r['is_active'] === 1,
                    'createdAt' => (string)$r['created_at'],
                ];
            }, $rows),
        ]);
    }

    $user = $rec ? $rec['username'] : null;
    $isDefault = $user !== null ? sw_is_default_password($pdo, $user) : false;
    sw_json([
        'ok' => true,
        'engine' => 'php-mysql',
        'authenticated' => $rec !== null,
        'username' => $user,
        'role' => $rec ? $rec['role'] : null,
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
        $me = sw_require_role($pdo, ['super_admin', 'manager', 'editor', 'viewer']);
        $curPass = (string)($body['currentPassword'] ?? '');
        $newPass = (string)($body['newPassword'] ?? '');
        if (strlen($newPass) < 6) {
            sw_json(['ok' => false, 'error' => 'New password must be at least 6 characters.'], 400);
        }
        $stmt = $pdo->prepare('SELECT `id`, `password_hash` FROM `admins` WHERE `id` = ? LIMIT 1');
        $stmt->execute([$me['id']]);
        $row = $stmt->fetch();
        if (!$row || !password_verify($curPass, $row['password_hash'])) {
            sw_json(['ok' => false, 'error' => 'Current password is incorrect.'], 401);
        }
        $upd = $pdo->prepare('UPDATE `admins` SET `password_hash` = ? WHERE `id` = ?');
        $upd->execute([password_hash($newPass, PASSWORD_DEFAULT), (int)$row['id']]);
        sw_json(['ok' => true, 'engine' => 'php-mysql', 'message' => 'Admin password updated cleanly.']);
    }

    if ($action === 'create_user') {
        sw_require_role($pdo, ['super_admin']);
        $newUsername = trim((string)($body['username'] ?? ''));
        $newPass = (string)($body['password'] ?? '');
        $newRole = trim((string)($body['role'] ?? 'editor'));
        if (!preg_match('/^[A-Za-z0-9_.-]{3,40}$/', $newUsername)) {
            sw_json(['ok' => false, 'error' => 'Username must be 3-40 letters, numbers, dot, underscore, or dash.'], 400);
        }
        if (strlen($newPass) < 6) {
            sw_json(['ok' => false, 'error' => 'Password must be at least 6 characters.'], 400);
        }
        if (!sw_valid_role($newRole)) {
            sw_json(['ok' => false, 'error' => 'Invalid role selected.'], 400);
        }
        $chk = $pdo->prepare('SELECT `id` FROM `admins` WHERE `username` = ? LIMIT 1');
        $chk->execute([$newUsername]);
        if ($chk->fetch()) {
            sw_json(['ok' => false, 'error' => 'Username already exists.'], 409);
        }
        $ins = $pdo->prepare('INSERT INTO `admins` (`username`, `password_hash`, `role`, `is_active`) VALUES (?, ?, ?, 1)');
        $ins->execute([$newUsername, password_hash($newPass, PASSWORD_DEFAULT), $newRole]);
        sw_json([
            'ok' => true,
            'engine' => 'php-mysql',
            'message' => 'Created user "' . $newUsername . '" (' . $newRole . ').',
            'user' => [
                'id' => (int)$pdo->lastInsertId(),
                'username' => $newUsername,
                'role' => $newRole,
                'isActive' => true,
            ],
        ]);
    }

    if ($action === 'update_user') {
        $me = sw_require_role($pdo, ['super_admin']);
        $targetId = (int)($body['userId'] ?? 0);
        if ($targetId <= 0) {
            sw_json(['ok' => false, 'error' => 'Valid userId is required.'], 400);
        }
        $targetStmt = $pdo->prepare('SELECT `id`, `username`, `role`, `is_active` FROM `admins` WHERE `id` = ? LIMIT 1');
        $targetStmt->execute([$targetId]);
        $target = $targetStmt->fetch();
        if (!$target) {
            sw_json(['ok' => false, 'error' => 'User not found.'], 404);
        }
        $nextRole = isset($body['role']) ? trim((string)$body['role']) : (string)$target['role'];
        if (!sw_valid_role($nextRole)) {
            sw_json(['ok' => false, 'error' => 'Invalid role selected.'], 400);
        }
        $nextActive = isset($body['isActive']) ? ((bool)$body['isActive'] ? 1 : 0) : (int)$target['is_active'];
        if ($targetId === $me['id'] && ($nextActive === 0 || $nextRole !== 'super_admin')) {
            sw_json(['ok' => false, 'error' => 'You cannot deactivate or demote your own Super Admin account.'], 400);
        }
        $upd = $pdo->prepare('UPDATE `admins` SET `role` = ?, `is_active` = ? WHERE `id` = ?');
        $upd->execute([$nextRole, $nextActive, $targetId]);
        sw_json(['ok' => true, 'engine' => 'php-mysql', 'message' => 'Updated user role/status.']);
    }

    if ($action === 'delete_user') {
        $me = sw_require_role($pdo, ['super_admin']);
        $targetId = (int)($body['userId'] ?? 0);
        if ($targetId <= 0 || $targetId === $me['id']) {
            sw_json(['ok' => false, 'error' => 'Cannot delete your active account or invalid userId.'], 400);
        }
        $del = $pdo->prepare('DELETE FROM `admins` WHERE `id` = ?');
        $del->execute([$targetId]);
        sw_json(['ok' => true, 'engine' => 'php-mysql', 'message' => 'Admin user deleted.']);
    }

    // Login rate limiting in session
    $failures = (int)($_SESSION['sw_login_failures'] ?? 0);
    $lockedUntil = (int)($_SESSION['sw_login_locked_until'] ?? 0);
    if ($lockedUntil > time()) {
        sw_json(['ok' => false, 'authenticated' => false, 'error' => 'Too many login attempts. Wait a few minutes.'], 429);
    }

    $username = trim((string)($body['username'] ?? ''));
    $password = (string)($body['password'] ?? '');

    $stmt = $pdo->prepare('SELECT `username`, `password_hash`, `role`, `is_active` FROM `admins` WHERE `username` = ? LIMIT 1');
    $stmt->execute([$username]);
    $row = $stmt->fetch();

    if (!$row || (int)($row['is_active'] ?? 1) !== 1 || !password_verify($password, $row['password_hash'])) {
        $failures += 1;
        $_SESSION['sw_login_failures'] = $failures;
        if ($failures >= 8) {
            $_SESSION['sw_login_locked_until'] = time() + 300;
            $_SESSION['sw_login_failures'] = 0;
        }
        sw_json(['ok' => false, 'authenticated' => false, 'error' => 'Invalid username, inactive user, or wrong password.'], 401);
    }

    $role = sw_valid_role((string)($row['role'] ?? '')) ? (string)$row['role'] : 'editor';
    unset($_SESSION['sw_login_failures'], $_SESSION['sw_login_locked_until']);
    session_regenerate_id(true);
    $_SESSION['sw_admin_user'] = $row['username'];
    $_SESSION['sw_admin_role'] = $role;

    sw_json([
        'ok' => true,
        'engine' => 'php-mysql',
        'authenticated' => true,
        'username' => $row['username'],
        'role' => $role,
        'usingDefaultPassword' => password_verify('admin123', $row['password_hash']),
    ]);
}

header('Allow: GET, POST, DELETE');
sw_json(['ok' => false, 'error' => 'Method not allowed'], 405);
