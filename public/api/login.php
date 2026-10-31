<?php
declare(strict_types=1);
ini_set('display_errors', '0');
define('ANNAHL_LOGIN_ENTRY', true);
require __DIR__ . '/login-core.php';
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store, private');
header('X-Content-Type-Options: nosniff');
try {
    if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') { header('Allow: POST'); annahl_fail(405, 'Metode tidak tersedia.'); }
    if (($_SERVER['HTTP_X_ANNAHL_LOGIN'] ?? '') !== '1') annahl_fail(403, 'Masuk melalui website resmi pondok.');
    if (strtolower(trim(explode(';', $_SERVER['CONTENT_TYPE'] ?? '')[0])) !== 'application/json') annahl_fail(415, 'Format login tidak sesuai.');
    if ((int)($_SERVER['CONTENT_LENGTH'] ?? 0) > 8192) annahl_fail(413, 'Isian login terlalu panjang.');
    $config = login_config();
    annahl_origin($config, $_SERVER);
    // Both limits count every attempt. Proxy-supplied IP headers are not trusted.
    annahl_rate($config, annahl_ip_tag($config, $_SERVER), 'login-ip', 60);
    $body = file_get_contents('php://input', false, null, 0, 8193);
    if ($body === false || strlen($body) > 8192) annahl_fail(413, 'Isian login terlalu panjang.');
    try { $input = login_input(json_decode($body, true, 4, JSON_THROW_ON_ERROR)); }
    catch (JsonException) { annahl_fail(401, ANNAHL_LOGIN_INVALID); }
    annahl_rate($config, hash_hmac('sha256', $input['username'], $config['shared_secret']), 'login-account', 30);
    echo json_encode(login_authenticate($config, $input), JSON_THROW_ON_ERROR);
} catch (AnnahlFormError $error) {
    http_response_code($error->status);
    echo json_encode(['ok' => false, 'message' => $error->getMessage()]);
} catch (Throwable) {
    http_response_code(503);
    echo json_encode(['ok' => false, 'message' => 'Login username belum tersedia. Gunakan email akun atau hubungi pengelola.']);
}
