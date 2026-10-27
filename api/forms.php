<?php
declare(strict_types=1);
define('ANNAHL_FORMS_ENTRY', true);
require __DIR__ . '/forms-core.php';
ini_set('display_errors', '0');
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store, private');
header('X-Content-Type-Options: nosniff');
try {
    $method = $_SERVER['REQUEST_METHOD'] ?? '';
    if (!in_array($method, ['GET','POST'], true)) { header('Allow: GET, POST'); annahl_fail(405, 'Metode tidak tersedia.'); }
    $config = annahl_config();
    // GET also requires the custom header, preventing a third-party page from minting tokens with a simple request.
    if (($_SERVER['HTTP_X_ANNAHL_FORM'] ?? '') !== '1') annahl_fail(403, 'Buka formulir melalui website pondok.');
    if ($method === 'POST') annahl_origin($config, $_SERVER);
    elseif (isset($_SERVER['HTTP_ORIGIN'])) annahl_origin($config, $_SERVER);
    // Older browsers may omit Fetch Metadata on same-origin GET. The custom
    // header still forces cross-origin browsers through a rejected preflight.
    elseif (!in_array($_SERVER['HTTP_SEC_FETCH_SITE'] ?? '', ['', 'same-origin', 'none'], true)) annahl_fail(403, 'Buka formulir melalui website pondok.');
    $tag = annahl_ip_tag($config, $_SERVER);
    if ($method === 'GET') {
        annahl_rate($config, $tag, 'token', 120);
        echo json_encode(['ok'=>true, 'token'=>annahl_token($config, $tag)], JSON_THROW_ON_ERROR);
    } else {
        if ((int)($_SERVER['CONTENT_LENGTH'] ?? 0) > 7 * 1024 * 1024 || stripos($_SERVER['CONTENT_TYPE'] ?? '', 'application/json') !== 0) annahl_fail(413, 'Total kiriman terlalu besar atau format tidak sesuai.');
        $body = file_get_contents('php://input', false, null, 0, 7 * 1024 * 1024 + 1);
        if ($body === false || strlen($body) > 7 * 1024 * 1024) annahl_fail(413, 'Total kiriman terlalu besar.');
        try { $input = json_decode($body, true, 20, JSON_THROW_ON_ERROR); } catch (JsonException) { annahl_fail(422, 'Format formulir tidak valid.'); }
        if (!is_array($input) || ($input['website'] ?? '') !== '') annahl_fail(422, 'Formulir tidak dapat diproses.');
        annahl_check_token($config, $tag, $input['token'] ?? null);
        annahl_rate($config, $tag, 'submit', $config['submissions_per_hour'] ?? 30);
        $record = annahl_submission($input);
        echo json_encode(annahl_forward($config, $record), JSON_THROW_ON_ERROR);
    }
} catch (AnnahlFormError $error) {
    http_response_code($error->status);
    echo json_encode(['ok'=>false, 'message'=>$error->getMessage()]);
} catch (Throwable) {
    http_response_code(503);
    echo json_encode(['ok'=>false, 'message'=>'Formulir belum dapat diproses. Coba lagi atau hubungi pengurus.']);
}
