<?php
declare(strict_types=1);
if (!defined('ANNAHL_LOGIN_ENTRY')) { http_response_code(404); exit; }
if (!defined('ANNAHL_FORMS_ENTRY')) define('ANNAHL_FORMS_ENTRY', true);
require_once __DIR__ . '/forms-core.php';

const ANNAHL_LOGIN_INVALID = 'Username atau password belum sesuai. Silakan coba lagi.';

function login_config(): array {
    $path = realpath(getenv('ANNAHL_LOGIN_CONFIG') ?: dirname(__DIR__, 2) . '/annahl-private/login-config.php');
    $web = str_replace('\\', '/', realpath(dirname(__DIR__)) ?: '');
    if (!$path || ($web && str_starts_with(str_replace('\\', '/', $path), $web . '/'))) annahl_fail(503, 'Login username belum diaktifkan.');
    $config = require $path;
    if (!is_array($config) || !preg_match('~^https://[a-z0-9]{20}\.supabase\.co$~D', $config['supabase_url'] ?? '')
        || !preg_match('/^[a-f0-9]{64}$/D', $config['shared_secret'] ?? '')
        || !is_array($config['allowed_origins'] ?? null) || !is_array($config['usernames'] ?? null)) annahl_fail(503, 'Konfigurasi login username belum siap.');
    $key = $config['supabase_anon_key'] ?? '';
    $parts = is_string($key) ? explode('.', $key) : [];
    $payload = count($parts) === 3 ? json_decode(base64_decode(strtr($parts[1], '-_', '+/')), true) : null;
    if (!is_string($key) || (!str_starts_with($key, 'sb_publishable_') && ($payload['role'] ?? '') !== 'anon')) annahl_fail(503, 'Gunakan public key untuk login.');
    foreach ($config['usernames'] as $username => $email) {
        if (!is_string($username) || !preg_match('/^[a-z0-9][a-z0-9._-]{2,31}$/D', $username) || !is_string($email) || !filter_var($email, FILTER_VALIDATE_EMAIL)) annahl_fail(503, 'Daftar username belum sesuai.');
    }
    return $config;
}

function login_input(mixed $input): array {
    if (!is_array($input) || !is_string($input['username'] ?? null) || !is_string($input['password'] ?? null)) annahl_fail(401, ANNAHL_LOGIN_INVALID);
    $username = strtolower(trim($input['username']));
    // Passwords are forwarded unchanged, including leading/trailing spaces.
    $password = $input['password'];
    if (!preg_match('/^[a-z0-9][a-z0-9._-]{2,31}$/D', $username) || strlen($password) < 1 || strlen($password) > 4096) annahl_fail(401, ANNAHL_LOGIN_INVALID);
    return ['username' => $username, 'password' => $password];
}

function login_http(string $url, string $method, array $headers, ?string $body, ?string $caFile): array {
    if (!function_exists('curl_init')) annahl_fail(503, 'Penghubung login memerlukan cURL PHP.');
    $curl = curl_init($url); $response = '';
    curl_setopt_array($curl, [CURLOPT_FOLLOWLOCATION => false, CURLOPT_CONNECTTIMEOUT => 8, CURLOPT_TIMEOUT => 12,
        CURLOPT_SSL_VERIFYPEER => true, CURLOPT_SSL_VERIFYHOST => 2, CURLOPT_CUSTOMREQUEST => $method, CURLOPT_HTTPHEADER => $headers,
        CURLOPT_WRITEFUNCTION => static function($curl, string $chunk) use (&$response): int {
            if (strlen($response) + strlen($chunk) > 100000) return 0;
            $response .= $chunk; return strlen($chunk);
        }]);
    if ($body !== null) curl_setopt($curl, CURLOPT_POSTFIELDS, $body);
    if ($caFile !== null) curl_setopt($curl, CURLOPT_CAINFO, $caFile);
    curl_exec($curl); $status = curl_getinfo($curl, CURLINFO_RESPONSE_CODE); $failed = curl_errno($curl); curl_close($curl);
    if ($failed) annahl_fail(502, 'Sambungan login belum berhasil. Coba lagi.');
    return [$status, $response];
}

function login_authenticate(array $config, array $input, ?callable $http = null): array {
    $http ??= 'login_http';
    // Unknown usernames still go through Auth and return the same failure message.
    $known = isset($config['usernames'][$input['username']]);
    $email = $config['usernames'][$input['username']] ?? 'unknown-' . bin2hex(random_bytes(16)) . '@login.invalid';
    $url = $config['supabase_url']; $key = $config['supabase_anon_key']; $caFile = $config['curl_ca_file'] ?? null;
    [$status, $body] = $http($url . '/auth/v1/token?grant_type=password', 'POST', ['apikey: ' . $key, 'Content-Type: application/json'],
        json_encode(['email' => $email, 'password' => $input['password']], JSON_THROW_ON_ERROR), $caFile);
    if ($status === 429) annahl_fail(429, 'Terlalu banyak percobaan. Silakan coba lagi nanti.');
    if (in_array($status, [400, 401, 403, 422], true)) annahl_fail(401, ANNAHL_LOGIN_INVALID);
    if (!$known && $status === 200) annahl_fail(401, ANNAHL_LOGIN_INVALID);
    $session = json_decode($body, true);
    if ($status !== 200 || !is_array($session) || !is_string($session['access_token'] ?? null) || !$session['access_token'] || !is_string($session['refresh_token'] ?? null) || !$session['refresh_token']
        || !preg_match('/^[a-f0-9-]{36}$/D', $session['user']['id'] ?? '')) annahl_fail(502, 'Respons layanan login belum sesuai.');
    // Never issue a website session for an inactive/non-staff account.
    [$status, $body] = $http($url . '/rest/v1/pengurus?select=role,active&id=eq.' . rawurlencode($session['user']['id']), 'GET',
        ['apikey: ' . $key, 'Authorization: Bearer ' . $session['access_token']], null, $caFile);
    $rows = json_decode($body, true); $profile = is_array($rows) ? ($rows[0] ?? null) : null;
    if ($status !== 200) annahl_fail(502, 'Akses pengurus belum dapat diperiksa.');
    if (!is_array($profile) || ($profile['active'] ?? false) !== true || !in_array($profile['role'] ?? '', ['admin', 'editor'], true)) annahl_fail(401, ANNAHL_LOGIN_INVALID);
    return ['ok' => true, 'access_token' => $session['access_token'], 'refresh_token' => $session['refresh_token']];
}
