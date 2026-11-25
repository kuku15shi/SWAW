<?php
declare(strict_types=1);

return [
    'db_host' => getenv('DB_HOST') ?: '127.0.0.1',
    'db_port' => getenv('DB_PORT') ?: '3306',
    'db_name' => getenv('DB_NAME') ?: 'socialwaves_db',
    'db_user' => getenv('DB_USER') ?: 'root',
    'db_pass' => getenv('DB_PASS') !== false ? getenv('DB_PASS') : '',
    'default_admin_user' => getenv('ADMIN_USERNAME') ?: 'admin',
    'default_admin_pass' => getenv('ADMIN_PASSWORD') ?: 'admin123',
    'frames_dir' => dirname(__DIR__) . DIRECTORY_SEPARATOR . 'frames',
    'max_upload_bytes' => 4 * 1024 * 1024,
];
