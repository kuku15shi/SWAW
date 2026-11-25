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
        $stats[$sr['campaign_id']] = [
            'clicks' => 0,
            'posters' => (int)$sr['cnt'],
            'downloads' => 0,
        ];
    }

    $metricRows = $pdo->query('SELECT `campaign_id`, `clicks`, `posters`, `downloads` FROM `campaign_metrics`')->fetchAll();
    foreach ($metricRows as $mr) {
        $cid = $mr['campaign_id'];
        $prevPosters = isset($stats[$cid]) ? (int)$stats[$cid]['posters'] : 0;
        $stats[$cid] = [
            'clicks' => (int)$mr['clicks'],
            'posters' => max($prevPosters, (int)$mr['posters']),
            'downloads' => (int)$mr['downloads'],
        ];
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
    $event = trim((string)($body['event'] ?? 'poster'));
    if ($campaignId === '' || !preg_match('/^[A-Za-z0-9_-]{2,40}$/', $campaignId)) {
        sw_json(['ok' => false, 'error' => 'Valid campaignId is required.'], 400);
    }
    if (!in_array($event, ['click', 'poster', 'download'], true)) {
        sw_json(['ok' => false, 'error' => 'Invalid event type.'], 400);
    }

    if ($event === 'click') {
        $pdo->prepare('INSERT INTO `campaign_metrics` (`campaign_id`, `clicks`, `posters`, `downloads`) VALUES (?, 1, 0, 0) ON DUPLICATE KEY UPDATE `clicks` = `clicks` + 1')->execute([$campaignId]);
    } elseif ($event === 'download') {
        $pdo->prepare('INSERT INTO `campaign_metrics` (`campaign_id`, `clicks`, `posters`, `downloads`) VALUES (?, 0, 0, 1) ON DUPLICATE KEY UPDATE `downloads` = `downloads` + 1')->execute([$campaignId]);
    } else {
        $pdo->prepare('INSERT INTO `campaign_metrics` (`campaign_id`, `clicks`, `posters`, `downloads`) VALUES (?, 0, 1, 0) ON DUPLICATE KEY UPDATE `posters` = `posters` + 1')->execute([$campaignId]);
        $values = isset($body['formValues']) && is_array($body['formValues']) ? $body['formValues'] : [];
        $supporterName = trim((string)($values['name'] ?? ($values['supporter_name'] ?? '')));
        $ins = $pdo->prepare('INSERT INTO `posters` (`campaign_id`, `supporter_name`, `form_values_json`) VALUES (?, ?, ?)');
        $ins->execute([
            $campaignId,
            substr($supporterName, 0, 191),
            json_encode($values, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE),
        ]);
    }

    $mStmt = $pdo->prepare('SELECT `clicks`, `posters`, `downloads` FROM `campaign_metrics` WHERE `campaign_id` = ? LIMIT 1');
    $mStmt->execute([$campaignId]);
    $metrics = $mStmt->fetch() ?: ['clicks' => 0, 'posters' => 0, 'downloads' => 0];

    sw_json([
        'ok' => true,
        'mode' => 'php-mysql',
        'campaignId' => $campaignId,
        'metrics' => [
            'clicks' => (int)$metrics['clicks'],
            'posters' => (int)$metrics['posters'],
            'downloads' => (int)$metrics['downloads'],
        ],
    ]);
}

header('Allow: GET, POST');
sw_json(['ok' => false, 'error' => 'Method not allowed'], 405);
