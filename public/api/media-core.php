<?php
declare(strict_types=1);
if (!defined('ANNAHL_MEDIA_ENTRY')) { http_response_code(404); exit; }
define('ANNAHL_FORMS_ENTRY', true);
require_once __DIR__ . '/forms-core.php';

function media_config(): array {
    $path = realpath(getenv('ANNAHL_MEDIA_CONFIG') ?: dirname(__DIR__, 2) . '/annahl-private/media-config.php');
    $web = realpath(dirname(__DIR__));
    if (!$path || ($web && str_starts_with(str_replace('\\', '/', $path), str_replace('\\', '/', $web) . '/'))) annahl_fail(503, 'Perpustakaan Drive belum diaktifkan.');
    $config = require $path;
    if (!is_array($config) || !preg_match('/^[a-f0-9]{64}$/D', $config['media_signing_key'] ?? '')) annahl_fail(503,'Kunci tautan foto belum tersedia.');
    if (!is_array($config) || !preg_match('/^[a-f0-9]{64}$/D', $config['shared_secret'] ?? '') || !preg_match('~^https://script\.google\.com/macros/s/[\w-]+/exec$~D', $config['apps_script_url'] ?? '') || !preg_match('~^https://[a-z0-9]{20}\.supabase\.co$~D', $config['supabase_url'] ?? '') || empty($config['supabase_anon_key'])) annahl_fail(503, 'Konfigurasi foto Drive belum siap.');
    $directory = $config['media_cache_directory'] ?? '';
    if (!$directory || (!is_dir($directory) && !@mkdir($directory, 0700, true))) annahl_fail(503, 'Penyimpanan pratinjau belum siap.');
    $resolved = realpath($directory);
    if (!$resolved || ($web && str_starts_with(str_replace('\\', '/', $resolved), str_replace('\\', '/', $web) . '/'))) annahl_fail(503, 'Konfigurasi pratinjau belum sesuai.');
    return $config;
}

function media_http(string $url, string $method, array $headers, ?string $body = null, int $limit = 4000000, ?string $caFile = null): array {
    if (!function_exists('curl_init')) annahl_fail(503, 'Penghubung Drive memerlukan cURL PHP.');
    $curl = curl_init($url); $response = ''; $location = '';
    curl_setopt_array($curl, [CURLOPT_FOLLOWLOCATION=>false, CURLOPT_CONNECTTIMEOUT=>12, CURLOPT_TIMEOUT=>90, CURLOPT_SSL_VERIFYPEER=>true, CURLOPT_SSL_VERIFYHOST=>2, CURLOPT_CUSTOMREQUEST=>$method, CURLOPT_HTTPHEADER=>$headers,
        CURLOPT_WRITEFUNCTION=>static function($curl, string $chunk) use (&$response, $limit): int { if (strlen($response) + strlen($chunk) > $limit) return 0; $response .= $chunk; return strlen($chunk); },
        CURLOPT_HEADERFUNCTION=>static function($curl, string $header) use (&$location): int { if (stripos($header, 'Location:') === 0) $location = trim(substr($header, 9)); return strlen($header); }]);
    if ($body !== null) curl_setopt($curl, CURLOPT_POSTFIELDS, $body);
    if ($caFile !== null) {
        if (!is_file($caFile)) annahl_fail(503,'Sertifikat koneksi lokal belum disiapkan.');
        curl_setopt($curl,CURLOPT_CAINFO,$caFile);
    }
    curl_exec($curl); $status = curl_getinfo($curl, CURLINFO_RESPONSE_CODE); $failed = curl_errno($curl); curl_close($curl);
    if ($failed) annahl_fail(502, 'Sambungan foto belum selesai. Coba lagi; unggahan yang sudah diterima akan dipakai kembali.');
    return [$status, $response, $location];
}

function media_user(array $config, array $server): array {
    if (!preg_match('/^Bearer ([A-Za-z0-9._-]{40,8000})$/D', $server['HTTP_AUTHORIZATION'] ?? '', $match)) annahl_fail(401, 'Masuk kembali sebagai pengurus.');
    $headers = ['apikey: '.$config['supabase_anon_key'], 'Authorization: Bearer '.$match[1]];
    [$status, $body] = media_http($config['supabase_url'].'/auth/v1/user', 'GET', $headers, null, 100000, $config['curl_ca_file'] ?? null);
    $user = json_decode($body, true);
    if ($status !== 200 || !preg_match('/^[a-f0-9-]{36}$/D', $user['id'] ?? '')) annahl_fail(401, 'Sesi pengurus telah berakhir.');
    [$status, $body] = media_http($config['supabase_url'].'/rest/v1/pengurus?select=role,active&id=eq.'.rawurlencode($user['id']), 'GET', $headers, null, 20000, $config['curl_ca_file'] ?? null);
    $rows = json_decode($body, true); $profile = is_array($rows) ? ($rows[0] ?? null) : null;
    if ($status !== 200 || !is_array($profile) || ($profile['active'] ?? false) !== true || !in_array($profile['role'] ?? '', ['admin','editor'], true)) annahl_fail(403, 'Akses pengurus belum aktif.');
    return ['id'=>$user['id'], 'role'=>$profile['role']];
}

function media_forward(array $config, array $record): array {
    $record += ['version'=>1, 'issuedAt'=>time(), 'id'=>sprintf('%s-%s-4%s-%s-%s', bin2hex(random_bytes(4)), bin2hex(random_bytes(2)), substr(bin2hex(random_bytes(2)),1), '8'.substr(bin2hex(random_bytes(2)),1), bin2hex(random_bytes(6)))];
    $data = json_encode($record, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_THROW_ON_ERROR);
    $envelope = json_encode(['scope'=>'media', 'data'=>$data, 'signature'=>hash_hmac('sha256', 'annahl.media.v1:'.$data, $config['shared_secret'])], JSON_THROW_ON_ERROR);
    [$status, $body, $location] = media_http($config['apps_script_url'], 'POST', ['Content-Type: application/json'], $envelope, 4000000, $config['curl_ca_file'] ?? null);
    if (in_array($status, [302,303], true)) {
        $parts = parse_url($location);
        if (($parts['scheme'] ?? '') !== 'https' || ($parts['host'] ?? '') !== 'script.googleusercontent.com' || isset($parts['user']) || isset($parts['pass'])) annahl_fail(502, 'Respons Drive tidak sesuai.');
        [$status, $body] = media_http($location, 'GET', [], null, 4000000, $config['curl_ca_file'] ?? null);
    }
    $reply = json_decode($body, true);
    if ($status !== 200 || !is_array($reply) || ($reply['ok'] ?? false) !== true || ($reply['id'] ?? '') !== $record['id'] || ($reply['action'] ?? '') !== $record['action']) {
        $code = is_array($reply) ? ($reply['code'] ?? '') : '';
        if ($code === 'conflict') annahl_fail(409, 'Foto dengan ID ini berbeda. Pilih ulang foto sebelum mencoba lagi.');
        if ($code === 'missing') annahl_fail(404, 'Foto belum tersedia.');
        if ($code === 'busy') annahl_fail(503, 'Drive sedang memproses foto lain. Coba lagi sebentar.');
        annahl_fail(503, 'Penghubung foto Drive belum siap. Perbarui deployment Rekap An-Nahl dan jalankan setupWebsiteMedia.');
    }
    return $reply;
}

function media_id(mixed $id): string {
    if (!is_string($id) || !preg_match('/^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/D', $id)) annahl_fail(422, 'ID foto tidak valid.');
    return $id;
}
function media_key(array $config, string $id, string $variant): string { return hash_hmac('sha256', 'annahl.photo.v1:'.$id.':'.$variant, $config['media_signing_key']); }
function media_cache_store(array $config, string $id, string $variant, array $image): void {
    if (!in_array($variant,['full','thumbnail'],true)) return;
    $temp = tempnam($config['media_cache_directory'],'image-');
    if (!$temp) return;
    file_put_contents($temp,json_encode($image,JSON_THROW_ON_ERROR),LOCK_EX); chmod($temp,0600);
    if (!@rename($temp,$config['media_cache_directory'].'/'.$id.'-'.$variant.'.json')) @unlink($temp);
}
function media_row(array $config, array $row): array {
    $id = media_id($row['id'] ?? null);
    $url = static fn(string $variant): string => '/api/media-image.php?id='.$id.'&size='.$variant.'&key='.media_key($config, $id, $variant);
    return ['id'=>$id, 'filename'=>$row['name'] ?? 'Foto pondok', 'folder'=>$row['folder'] ?? 'Unggahan pengurus', 'createdAt'=>$row['createdAt'] ?? '', 'full'=>$url('full'), 'thumbnail'=>$url('thumbnail'), 'originalUrl'=>$row['originalUrl'] ?? '', 'complete'=>($row['complete'] ?? false) === true];
}
function media_validate_file(array $input, string $variant): array {
    $file = $input['file'] ?? null; $limit = $variant === 'original' ? 20*1024*1024 : 2*1024*1024;
    if (!is_array($file) || !is_string($file['data'] ?? null) || strlen($file['data']) > (int)ceil($limit/3)*4) annahl_fail(413, 'Ukuran foto melebihi batas.');
    $bytes = base64_decode($file['data'], true);
    if ($bytes === false || !strlen($bytes) || strlen($bytes) > $limit) annahl_fail(422, 'Berkas foto tidak valid.');
    $name = annahl_text($file, 'name', 1, 180); if (preg_match('~[/\\\\\x00-\x1f]~', $name)) annahl_fail(422, 'Nama foto tidak sesuai.');
    $image = @getimagesizefromstring($bytes); $mime = $image['mime'] ?? '';
    if (!in_array($mime, ['image/jpeg','image/png','image/webp','image/gif'], true) || $image[0]*$image[1] > 40000000) annahl_fail(422, 'Pilih foto JPG, PNG, WebP, atau GIF yang valid.');
    return ['name'=>$name,'mime'=>$mime,'bytes'=>strlen($bytes),'sha256'=>hash('sha256',$bytes),'data'=>$file['data']];
}
