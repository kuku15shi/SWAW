<?php
declare(strict_types=1);

require_once __DIR__ . '/db.php';

$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';

try {
    $pdo = sw_db();
} catch (Throwable $e) {
    sw_json([
        'ok' => true,
        'configured' => false,
        'mode' => 'mysql-error',
        'error' => $e->getMessage(),
        'campaigns' => [],
        'stats' => new stdClass(),
    ]);
}

function sw_row_to_campaign(array $row): array
{
    $cw = max(40, (int)$row['crop_width']);
    $ch = max(40, (int)$row['crop_height']);
    $slot = json_decode((string)$row['slot_json'], true);
    $palette = json_decode((string)$row['palette_json'], true);
    $fields = json_decode((string)$row['fields_json'], true);
    $textSlots = json_decode((string)$row['text_slots_json'], true);

    return [
        'id' => $row['id'],
        'title' => $row['title'],
        'subtitle' => $row['subtitle'],
        'badge' => $row['badge'],
        'frameId' => $row['frame_id'] ?: ('custom-' . $row['id']),
        'frameWidth' => max(100, (int)$row['frame_width']),
        'frameHeight' => max(100, (int)$row['frame_height']),
        'cropWidth' => $cw,
        'cropHeight' => $ch,
        'aspectRatio' => $cw / $ch,
        'slot' => is_array($slot) ? $slot : ['x' => 260, 'y' => 245, 'w' => 280, 'h' => 336, 'radius' => 28, 'rotation' => 0, 'layer' => 'behind'],
        'palette' => is_array($palette) ? $palette : ['bg1' => '#047857', 'bg2' => '#10b981', 'accent' => '#d1fae5', 'dark' => '#17211f'],
        'headerTag' => $row['header_tag'],
        'footerText' => $row['footer_text'],
        'customFrameUrl' => $row['custom_frame_url'],
        'fields' => is_array($fields) ? $fields : [],
        'textSlots' => is_array($textSlots) ? $textSlots : [],
        'startDate' => (string)($row['start_date'] ?? ''),
        'endDate' => (string)($row['end_date'] ?? ''),
        'validityDays' => (int)($row['validity_days'] ?? 0),
        'createdAt' => !empty($row['created_at']) ? strtotime((string)$row['created_at']) * 1000 : (int)$row['updated_at'],
        '_updatedAt' => (int)$row['updated_at'],
    ];
}

if ($method === 'GET') {
    $rows = $pdo->query('SELECT * FROM `campaigns` ORDER BY `updated_at` DESC, `created_at` DESC')->fetchAll();
    $campaigns = array_map('sw_row_to_campaign', $rows);

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

    sw_json([
        'ok' => true,
        'configured' => true,
        'mode' => 'php-mysql',
        'campaigns' => $campaigns,
        'stats' => empty($stats) ? new stdClass() : $stats,
    ]);
}

if ($method === 'POST') {
    $adminUser = sw_current_admin();
    $creator = $adminUser ?? 'public';
    $body = sw_read_json_body();
    $c = isset($body['campaign']) && is_array($body['campaign']) ? $body['campaign'] : $body;

    $id = trim((string)($c['id'] ?? ''));
    $title = trim((string)($c['title'] ?? ''));
    if ($id === '' || $title === '') {
        sw_json(['ok' => false, 'error' => 'Campaign id and title are required.'], 400);
    }
    if (!sw_valid_campaign_id($id)) {
        sw_json(['ok' => false, 'error' => 'Short code must be 2-40 URL-safe characters and not a reserved page name.'], 400);
    }

    // Prevent public uploaders from overwriting existing or built-in campaigns
    if ($adminUser === null) {
        $builtInIds = ['4SzGA', 'zpwQq'];
        $dupStmt = $pdo->prepare('SELECT `id` FROM `campaigns` WHERE `id` = ? LIMIT 1');
        $dupStmt->execute([$id]);
        if (in_array($id, $builtInIds, true) || $dupStmt->fetch()) {
            $baseId = substr($id, 0, 32);
            do {
                $candidate = $baseId . '-' . random_int(100, 999);
                $dupStmt->execute([$candidate]);
            } while ($dupStmt->fetch());
            $id = $candidate;
        }
    }

    $cfg = sw_config();
    $frameUrl = trim((string)($c['customFrameUrl'] ?? ''));
    $dataUrl = (string)($c['customFrameDataUrl'] ?? '');

    if ($dataUrl !== '' && preg_match('/^data:image\/([a-zA-Z0-9+.-]+);base64,(.+)$/', $dataUrl, $m)) {
        $ext = strtolower(str_replace(['jpeg', '+xml'], ['jpg', ''], $m[1]));
        if (!in_array($ext, ['png', 'webp', 'jpg', 'gif'], true)) {
            $ext = 'png';
        }
        $bin = base64_decode($m[2], true);
        if ($bin === false || strlen($bin) < 12 || strlen($bin) > $cfg['max_upload_bytes']) {
            sw_json(['ok' => false, 'error' => 'Uploaded frame image is invalid or exceeds 4 MB.'], 413);
        }
        $isValidImage = (@getimagesizefromstring($bin) !== false)
            || (substr($bin, 0, 4) === 'RIFF' && substr($bin, 8, 4) === 'WEBP');
        if (!$isValidImage) {
            sw_json(['ok' => false, 'error' => 'Uploaded file must be a valid PNG, JPG, GIF, or WebP image.'], 400);
        }
        $framesDir = $cfg['frames_dir'];
        if (!is_dir($framesDir) && !mkdir($framesDir, 0755, true) && !is_dir($framesDir)) {
            sw_json(['ok' => false, 'error' => 'Failed to create frames directory on server.'], 500);
        }
        // Remove previous extension copies for this id so stale frames aren't left behind
        foreach (glob($framesDir . DIRECTORY_SEPARATOR . $id . '.*') ?: [] as $oldFile) {
            if (is_file($oldFile)) {
                @unlink($oldFile);
            }
        }
        $targetFile = $framesDir . DIRECTORY_SEPARATOR . $id . '.' . $ext;
        if (file_put_contents($targetFile, $bin) === false) {
            sw_json(['ok' => false, 'error' => 'Failed to write frame image file.'], 500);
        }
        $frameUrl = 'frames/' . $id . '.' . $ext . '?v=' . time();
    }

    $updatedAt = (int)round(microtime(true) * 1000);
    $startDate = preg_match('/^\d{4}-\d{2}-\d{2}$/', (string)($c['startDate'] ?? '')) ? (string)$c['startDate'] : '';
    $endDate = preg_match('/^\d{4}-\d{2}-\d{2}$/', (string)($c['endDate'] ?? '')) ? (string)$c['endDate'] : '';
    $validityDays = max(0, min(3650, (int)($c['validityDays'] ?? 0)));

    $stmt = $pdo->prepare("
        INSERT INTO `campaigns` (
            `id`, `title`, `subtitle`, `badge`, `frame_id`,
            `frame_width`, `frame_height`, `crop_width`, `crop_height`,
            `slot_json`, `palette_json`, `header_tag`, `footer_text`,
            `custom_frame_url`, `fields_json`, `text_slots_json`,
            `start_date`, `end_date`, `validity_days`,
            `created_by`, `updated_at`
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
            `title` = VALUES(`title`),
            `subtitle` = VALUES(`subtitle`),
            `badge` = VALUES(`badge`),
            `frame_id` = VALUES(`frame_id`),
            `frame_width` = VALUES(`frame_width`),
            `frame_height` = VALUES(`frame_height`),
            `crop_width` = VALUES(`crop_width`),
            `crop_height` = VALUES(`crop_height`),
            `slot_json` = VALUES(`slot_json`),
            `palette_json` = VALUES(`palette_json`),
            `header_tag` = VALUES(`header_tag`),
            `footer_text` = VALUES(`footer_text`),
            `custom_frame_url` = VALUES(`custom_frame_url`),
            `fields_json` = VALUES(`fields_json`),
            `text_slots_json` = VALUES(`text_slots_json`),
            `start_date` = VALUES(`start_date`),
            `end_date` = VALUES(`end_date`),
            `validity_days` = VALUES(`validity_days`),
            `created_by` = VALUES(`created_by`),
            `updated_at` = VALUES(`updated_at`)
    ");

    $stmt->execute([
        $id,
        substr($title, 0, 191),
        substr((string)($c['subtitle'] ?? ''), 0, 255),
        substr((string)($c['badge'] ?? 'Custom Campaign'), 0, 100),
        substr((string)($c['frameId'] ?? ('custom-' . $id)), 0, 64),
        max(100, (int)($c['frameWidth'] ?? 800)),
        max(100, (int)($c['frameHeight'] ?? 1000)),
        max(40, (int)($c['cropWidth'] ?? 260)),
        max(40, (int)($c['cropHeight'] ?? 300)),
        json_encode($c['slot'] ?? new stdClass(), JSON_UNESCAPED_SLASHES),
        json_encode($c['palette'] ?? new stdClass(), JSON_UNESCAPED_SLASHES),
        substr((string)($c['headerTag'] ?? ''), 0, 191),
        substr((string)($c['footerText'] ?? ''), 0, 255),
        substr($frameUrl, 0, 512),
        json_encode($c['fields'] ?? [], JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE),
        json_encode($c['textSlots'] ?? [], JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE),
        $startDate,
        $endDate,
        $validityDays,
        $creator,
        $updatedAt,
    ]);

    $fetch = $pdo->prepare('SELECT * FROM `campaigns` WHERE `id` = ? LIMIT 1');
    $fetch->execute([$id]);
    $savedRow = $fetch->fetch();

    sw_json([
        'ok' => true,
        'configured' => true,
        'mode' => 'php-mysql',
        'campaign' => $savedRow ? sw_row_to_campaign($savedRow) : $c,
    ]);
}

if ($method === 'DELETE') {
    sw_require_admin();
    $id = trim((string)($_GET['id'] ?? ''));
    if ($id === '' || !sw_valid_campaign_id($id)) {
        sw_json(['ok' => false, 'error' => 'Invalid campaign id.'], 400);
    }

    $del = $pdo->prepare('DELETE FROM `campaigns` WHERE `id` = ?');
    $del->execute([$id]);
    $pdo->prepare('DELETE FROM `campaign_metrics` WHERE `campaign_id` = ?')->execute([$id]);
    $pdo->prepare('DELETE FROM `posters` WHERE `campaign_id` = ?')->execute([$id]);

    $framesDir = sw_config()['frames_dir'];
    foreach (glob($framesDir . DIRECTORY_SEPARATOR . $id . '.*') ?: [] as $oldFile) {
        if (is_file($oldFile)) {
            @unlink($oldFile);
        }
    }

    sw_json(['ok' => true, 'mode' => 'php-mysql']);
}

header('Allow: GET, POST, DELETE');
sw_json(['ok' => false, 'error' => 'Method not allowed'], 405);
