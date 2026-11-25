<?php
declare(strict_types=1);

require_once __DIR__ . '/db.php';

$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';

try {
    $pdo = sw_db();
} catch (Throwable $e) {
    sw_json(['ok' => false, 'error' => 'Database error: ' . $e->getMessage()], 500);
}

if ($method === 'GET') {
    $stats = [];
    $statRows = $pdo->query('SELECT `campaign_id`, COUNT(*) AS `cnt` FROM `posters` GROUP BY `campaign_id`')->fetchAll();
    foreach ($statRows as $sr) {
        $stats[$sr['campaign_id']] = (int)$sr['cnt'];
    }

    $recent = [];
    if (sw_current_admin() !== null) {
        $recent = $pdo->query('SELECT `id`, `campaign_id`, `supporter_name`, `created_at` FROM `posters` ORDER BY `id` DESC LIMIT 25')->fetchAll();
    }

    sw_json([
        'ok' => true,
        'mode' => 'php-mysql',
        'stats' => empty($stats) ? new stdClass() : $stats,
        'recent' => $recent,
    ]);
}

if ($method === 'POST') {
    $body = sw_read_json_body();
    $campaignId = trim((string)($body['campaignId'] ?? ''));
    if ($campaignId === '' || !preg_match('/^[A-Za-z0-9_-]{2,40}$/', $campaignId)) {
        sw_json(['ok' => false, 'error' => 'Valid campaignId is required.'], 400);
    }

    $values = isset($body['formValues']) && is_array($body['formValues']) ? $body['formValues'] : [];
    $supporterName = trim((string)($values['name'] ?? ($values['supporter_name'] ?? '')));

    $ins = $pdo->prepare('INSERT INTO `posters` (`campaign_id`, `supporter_name`, `form_values_json`) VALUES (?, ?, ?)');
    $ins->execute([
        $campaignId,
        substr($supporterName, 0, 191),
        json_encode($values, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE),
    ]);

    $cntStmt = $pdo->prepare('SELECT COUNT(*) FROM `posters` WHERE `campaign_id` = ?');
    $cntStmt->execute([$campaignId]);
    $total = (int)$cntStmt->fetchColumn();

    sw_json([
        'ok' => true,
        'mode' => 'php-mysql',
        'campaignId' => $campaignId,
        'count' => $total,
    ]);
}

header('Allow: GET, POST');
sw_json(['ok' => false, 'error' => 'Method not allowed'], 405);
