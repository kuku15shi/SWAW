<?php
declare(strict_types=1);

$defaults = [
    'db_host' => getenv('DB_HOST') ?: '127.0.0.1',
    'db_port' => getenv('DB_PORT') ?: '3306',
    'db_name' => getenv('DB_NAME') ?: 'socialwaves_db',
    'db_user' => getenv('DB_USER') ?: 'root',
    'db_pass' => getenv('DB_PASS') !== false ? getenv('DB_PASS') : '',
    'frames_dir' => dirname(__DIR__) . DIRECTORY_SEPARATOR . 'frames',
    'max_upload_bytes' => 4 * 1024 * 1024,
];

$localFile = __DIR__ . DIRECTORY_SEPARATOR . 'config.local.php';
if (is_file($localFile)) {
    $local = require $localFile;
    if (is_array($local)) {
        $defaults = array_merge($defaults, $local);
    }
}

return $defaults;
