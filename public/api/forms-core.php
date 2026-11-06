<?php
declare(strict_types=1);
if (!defined('ANNAHL_FORMS_ENTRY')) { http_response_code(404); exit; }

final class AnnahlFormError extends RuntimeException {
    public function __construct(public int $status, string $message) { parent::__construct($message); }
}

function annahl_fail(int $status, string $message): never { throw new AnnahlFormError($status, $message); }

const ANNAHL_FILE_LIMIT = 10 * 1024 * 1024;
const ANNAHL_TOTAL_LIMIT = 15 * 1024 * 1024;
const ANNAHL_BODY_LIMIT = 21 * 1024 * 1024;

function annahl_registration_settings(array $config): array {
    $url = $config['supabase_url'] ?? '';
    $key = $config['supabase_anon_key'] ?? '';
    $test = PHP_SAPI === 'cli-server' && getenv('ANNAHL_FORMS_TEST_MODE') === '1';
    if (!function_exists('curl_init') || (!preg_match('~^https://[a-z0-9]{20}\.supabase\.co$~D', $url)
        && !($test && preg_match('~^http://127\.0\.0\.1:\d+$~D', $url))) || !is_string($key) ||
        !preg_match('/^[A-Za-z0-9._-]{20,800}$/D', $key) || str_starts_with($key, 'sb_secret_')) {
        annahl_fail(503, 'Jadwal pendaftaran belum dapat dimuat.');
    }
    $headers = ['apikey: ' . $key, 'Accept: application/json', 'Cache-Control: no-cache'];
    if (!str_starts_with($key, 'sb_publishable_')) {
        $claims = explode('.', $key)[1] ?? '';
        $decoded = json_decode((string)base64_decode(strtr($claims, '-_', '+/'), true), true);
        if (!$test && ($decoded['role'] ?? '') !== 'anon') annahl_fail(503, 'Jadwal pendaftaran belum dapat dimuat.');
        $headers[] = 'Authorization: Bearer ' . $key;
    }
    $curl = curl_init($url . '/rest/v1/pondok_settings?id=eq.1&select=*&limit=1');
    $body = '';
    curl_setopt_array($curl, [CURLOPT_FOLLOWLOCATION=>false, CURLOPT_CONNECTTIMEOUT=>4, CURLOPT_TIMEOUT=>8,
        CURLOPT_HTTPHEADER=>$headers, CURLOPT_WRITEFUNCTION=>static function($handle, string $part) use (&$body): int {
            if (strlen($body) + strlen($part) > 32000) return 0;
            $body .= $part; return strlen($part);
        }]);
    if (!empty($config['curl_ca_file'])) curl_setopt($curl, CURLOPT_CAINFO, $config['curl_ca_file']);
    $ok = curl_exec($curl); $status = curl_getinfo($curl, CURLINFO_RESPONSE_CODE); curl_close($curl);
    $settings = json_decode($body, true)[0] ?? null;
    if (!$ok || $status !== 200 || !is_array($settings) || !is_array($settings['levels'] ?? null) ||
        !is_int($settings['revision'] ?? null)) annahl_fail(503, 'Jadwal pendaftaran belum dapat dimuat.');
    return $settings;
}

function annahl_registration_status(array $settings, ?int $now = null): array {
    $now ??= time();
    $tz = new DateTimeZone('Asia/Jakarta');
    $start = !empty($settings['opens_on']) ? DateTimeImmutable::createFromFormat('!Y-m-d', $settings['opens_on'], $tz) : null;
    $end = !empty($settings['closes_on']) ? DateTimeImmutable::createFromFormat('!Y-m-d', $settings['closes_on'], $tz) : null;
    $opens = $start ? $start->getTimestamp() : null;
    $closes = $end ? $end->modify('+1 day')->getTimestamp() : null;
    $registration = $settings['registration'] ?? [];
    $state = !$opens || !$closes || empty($settings['levels']) || empty($registration['year']) ? 'unscheduled'
        : (($registration['recap_ready'] ?? false) !== true ? 'preparing' : ($now < $opens ? 'upcoming' : ($now >= $closes ? 'closed' : 'open')));
    return $settings + ['state'=>$state, 'serverTime'=>$now, 'opensAt'=>$opens, 'closesAt'=>$closes];
}

function annahl_require_open(array $settings, ?int $now = null): void {
    if (annahl_registration_status($settings, $now)['state'] !== 'open') {
        annahl_fail(409, 'Pendaftaran tidak sedang dibuka. Periksa jadwal atau hubungi pengurus.');
    }
}

function annahl_config(): array {
    $file = getenv('ANNAHL_FORMS_CONFIG') ?: dirname(__DIR__, 2) . '/annahl-private/forms-config.php';
    $path = realpath($file);
    $webRoot = realpath(dirname(__DIR__));
    if (!$path || ($webRoot && str_starts_with(str_replace('\\', '/', $path), str_replace('\\', '/', $webRoot) . '/'))) {
        annahl_fail(503, 'Formulir sedang disiapkan. Silakan hubungi pengurus melalui WhatsApp.');
    }
    $config = require $path;
    if (!is_array($config) || !preg_match('/^[a-f0-9]{64}$/D', $config['shared_secret'] ?? '')) annahl_fail(503, 'Konfigurasi formulir belum siap.');
    $url = $config['apps_script_url'] ?? '';
    $test = PHP_SAPI === 'cli-server' && getenv('ANNAHL_FORMS_TEST_MODE') === '1';
    if (!preg_match('~^https://script\.google\.com/macros/s/[A-Za-z0-9_-]+/exec$~D', $url)
        && !($test && preg_match('~^http://127\.0\.0\.1:\d+/exec$~D', $url))) annahl_fail(503, 'Sambungan formulir belum diaktifkan.');
    // Older installations already keep these public Supabase values in the
    // sibling photo config. Reuse only those values, never photo signing keys.
    if (empty($config['supabase_url']) || empty($config['supabase_anon_key'])) {
        $mediaPath=realpath(dirname($path).'/media-config.php');
        if ($mediaPath && $mediaPath!==$path && (!$webRoot || !str_starts_with(str_replace('\\','/',$mediaPath),str_replace('\\','/',$webRoot).'/'))) {
            $mediaSettings=(static function(string $file): mixed { return require $file; })($mediaPath);
            if (is_array($mediaSettings)) foreach (['supabase_url','supabase_anon_key','curl_ca_file'] as $key) {
                if (empty($config[$key]) && isset($mediaSettings[$key])) $config[$key]=$mediaSettings[$key];
            }
        }
    }
    return $config;
}

function annahl_origin(array $config, array $server): string {
    $origin = rtrim($server['HTTP_ORIGIN'] ?? '', '/');
    if (!in_array($origin, $config['allowed_origins'] ?? [], true)) annahl_fail(403, 'Kirim formulir melalui website resmi pondok.');
    return $origin;
}

function annahl_ip_tag(array $config, array $server): string {
    // Never trust a client-supplied X-Forwarded-For header.
    return hash_hmac('sha256', $server['REMOTE_ADDR'] ?? 'unknown', $config['shared_secret']);
}

function annahl_rate(array $config, string $tag, string $action, int $limit): void {
    $directory = $config['rate_limit_directory'] ?? '';
    $webRoot = realpath(dirname(__DIR__));
    if (!$directory || (!is_dir($directory) && !@mkdir($directory, 0700, true))) annahl_fail(503, 'Formulir belum dapat menerima kiriman.');
    $resolved = realpath($directory);
    if (!$resolved || ($webRoot && str_starts_with(str_replace('\\', '/', $resolved), str_replace('\\', '/', $webRoot) . '/'))) annahl_fail(503, 'Konfigurasi formulir belum siap.');
    // Fixed-size hashed-IP counters only. No names, addresses, files, or request bodies are stored here.
    $handle = @fopen($resolved . '/' . $action . '-' . substr($tag, 0, 2) . '.json', 'c+');
    if (!$handle || !flock($handle, LOCK_EX)) annahl_fail(503, 'Formulir sedang sibuk. Coba lagi.');
    try {
        $records = json_decode(stream_get_contents($handle), true) ?: [];
        $now = time();
        foreach ($records as $key => $record) if (($record['until'] ?? 0) <= $now) unset($records[$key]);
        $record = $records[$tag] ?? ['until' => $now + 3600, 'count' => 0];
        if ($record['count'] >= $limit) annahl_fail(429, 'Terlalu banyak percobaan. Silakan coba lagi nanti atau hubungi pengurus.');
        $record['count']++; $records[$tag] = $record;
        rewind($handle); ftruncate($handle, 0); fwrite($handle, json_encode($records, JSON_THROW_ON_ERROR)); fflush($handle);
    } finally { flock($handle, LOCK_UN); fclose($handle); }
}

function annahl_token(array $config, string $tag, ?int $now = null): string {
    $stamp = (string)($now ?? time());
    $nonce = bin2hex(random_bytes(16));
    return $stamp . '.' . $nonce . '.' . hash_hmac('sha256', $stamp . '.' . $nonce . '.' . $tag, $config['shared_secret']);
}

function annahl_check_token(array $config, string $tag, mixed $token, ?int $now = null): void {
    if (!is_string($token) || !preg_match('/^(\d{10})\.([a-f0-9]{32})\.([a-f0-9]{64})$/D', $token, $parts)) annahl_fail(403, 'Sesi formulir berakhir. Muat ulang halaman lalu coba lagi.');
    $age = ($now ?? time()) - (int)$parts[1];
    $expected = hash_hmac('sha256', $parts[1] . '.' . $parts[2] . '.' . $tag, $config['shared_secret']);
    if ($age < -30 || $age > 3600 || !hash_equals($expected, $parts[3])) annahl_fail(403, 'Sesi formulir berakhir. Muat ulang halaman lalu coba lagi.');
}

function annahl_text(array $values, string $key, int $min = 0, int $max = 300): string {
    $value = $values[$key] ?? '';
    if (!is_string($value) || !preg_match('//u', $value)) annahl_fail(422, 'Isian formulir tidak valid.');
    $value = trim($value);
    $length = function_exists('mb_strlen') ? mb_strlen($value, 'UTF-8') : strlen($value);
    if ($length < $min || $length > $max || preg_match('/[\x00-\x08\x0b\x0c\x0e-\x1f]/', $value)) annahl_fail(422, 'Periksa isian ' . $key . '.');
    return $value;
}

function annahl_office_zip(string $bytes, string $root): bool {
    $end = strrpos($bytes, "PK\x05\x06");
    if ($end === false || strlen($bytes) - $end < 22) return false;
    $info = unpack('vdisk/vstart/ventriesDisk/ventries/Vsize/Voffset/vcomment', substr($bytes, $end + 4, 18));
    if ($info['disk'] || $info['start'] || $info['entries'] > 2000 || $info['offset'] + $info['size'] > $end) return false;
    $at = $info['offset']; $names = []; $expanded = 0;
    for ($i = 0; $i < $info['entries']; $i++) {
        if (substr($bytes, $at, 4) !== "PK\x01\x02" || $at + 46 > $end) return false;
        $flags = unpack('v', substr($bytes, $at + 8, 2))[1];
        $expanded += unpack('V', substr($bytes, $at + 24, 4))[1];
        $sizes = unpack('vname/vextra/vcomment', substr($bytes, $at + 28, 6));
        $name = substr($bytes, $at + 46, $sizes['name']);
        if (($flags & 1) || $expanded > 50 * 1024 * 1024 || $sizes['name'] > 1024 || str_contains($name, '..') || stripos($name, 'vbaProject') !== false) return false;
        $names[$name] = true; $at += 46 + $sizes['name'] + $sizes['extra'] + $sizes['comment'];
    }
    return isset($names['[Content_Types].xml'], $names[$root]);
}

function annahl_files(mixed $input): array {
    if (!is_array($input) || count($input) > 3) annahl_fail(422, 'Lampirkan paling banyak 3 berkas.');
    $result = []; $total = 0;
    $office = ['docx' => ['word/document.xml', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'], 'xlsx' => ['xl/workbook.xml', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'], 'pptx' => ['ppt/presentation.xml', 'application/vnd.openxmlformats-officedocument.presentationml.presentation']];
    foreach ($input as $file) {
        if (!is_array($file) || !is_string($file['data'] ?? null) || strlen($file['data']) > 4 * intdiv(ANNAHL_FILE_LIMIT + 2, 3)) annahl_fail(422, 'Berkas tidak valid atau melebihi 10 MB.');
        $name = annahl_text($file, 'name', 1, 180);
        $name = preg_replace('~[/\\\\\x00-\x1f\x7f]~u', '_', $name);
        $ext = strtolower(pathinfo($name, PATHINFO_EXTENSION));
        $bytes = base64_decode($file['data'], true);
        if ($bytes === false || strlen($bytes) < 1 || strlen($bytes) > ANNAHL_FILE_LIMIT) annahl_fail(422, 'Ukuran setiap berkas harus antara 1 byte dan 10 MB.');
        $total += strlen($bytes);
        if ($total > ANNAHL_TOTAL_LIMIT) annahl_fail(422, 'Total lampiran maksimal 15 MB.');
        $mime = null;
        if (in_array($ext, ['jpg','jpeg','png','webp'], true)) {
            $image = @getimagesizefromstring($bytes);
            $expected = ['jpg'=>'image/jpeg','jpeg'=>'image/jpeg','png'=>'image/png','webp'=>'image/webp'][$ext];
            if ($image && ($image['mime'] ?? '') === $expected && $image[0] * $image[1] <= 80000000) $mime = $expected;
        } elseif ($ext === 'pdf' && str_starts_with($bytes, '%PDF-')) $mime = 'application/pdf';
        elseif (isset($office[$ext]) && annahl_office_zip($bytes, $office[$ext][0])) $mime = $office[$ext][1];
        if (!$mime) annahl_fail(422, 'Pilih JPG, PNG, WebP, PDF, DOCX, XLSX, atau PPTX yang valid.');
        $result[] = ['name'=>$name, 'mime'=>$mime, 'bytes'=>strlen($bytes), 'sha256'=>hash('sha256', $bytes), 'data'=>base64_encode($bytes)];
    }
    return $result;
}

function annahl_submission(array $input, ?array $settings = null): array {
    $id = $input['id'] ?? '';
    $kind = $input['kind'] ?? '';
    if (!is_string($id) || !preg_match('/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/iD', $id) || !in_array($kind, ['pendaftaran','donasi'], true)) annahl_fail(422, 'Jenis atau ID kiriman tidak valid.');
    $fields = $input['payload'] ?? null;
    if (!is_array($fields) || strlen(json_encode($fields)) > 18000) annahl_fail(422, 'Isian formulir terlalu panjang.');
    $payload = ['nama'=>annahl_text($fields, 'nama', 2, 180)];
    if ($kind === 'pendaftaran') {
        if ($settings === null) annahl_fail(503, 'Jadwal pendaftaran belum dapat dimuat.');
        annahl_require_open($settings);
        $year=annahl_text($fields,'registrationYear',4,4);
        if ($year !== (string)($settings['registration']['year'] ?? '')) annahl_fail(409,'Periode penerimaan sudah berubah. Muat ulang jadwal sebelum mengirim.');
        foreach (['tempatLahir','tanggalLahir','jenisKelamin','asalSekolah','jenjang','namaWali','noWA'] as $key) $payload[$key] = annahl_text($fields, $key, 1, 180);
        $payload['email'] = annahl_text($fields, 'email', 0, 254);
        $payload['alamat'] = annahl_text($fields, 'alamat', 2, 2000);
        $date = DateTimeImmutable::createFromFormat('!Y-m-d', $payload['tanggalLahir']);
        if (!$date || $date->format('Y-m-d') !== $payload['tanggalLahir'] || $payload['tanggalLahir'] > (new DateTimeImmutable('now', new DateTimeZone('Asia/Jakarta')))->format('Y-m-d')) annahl_fail(422, 'Periksa tanggal lahir.');
        if (!preg_match('/^\+?[\d\s()-]{8,24}$/D', $payload['noWA']) || ($payload['email'] !== '' && !filter_var($payload['email'], FILTER_VALIDATE_EMAIL))) annahl_fail(422, 'Periksa nomor WhatsApp dan email.');
        if ($payload['jenisKelamin'] !== 'Laki-laki' || !in_array($payload['jenjang'], array_column($settings['levels'], 'title'), true)) annahl_fail(422, 'Pendaftaran saat ini untuk santri putra. Pilih jenjang yang tersedia.');
    } else {
        $payload['jumlah'] = annahl_text($fields, 'jumlah', 1, 12);
        $payload['metode'] = annahl_text($fields, 'metode', 1, 100);
        $payload['program'] = annahl_text($fields, 'program', 0, 180);
        $payload['pesan'] = annahl_text($fields, 'pesan', 0, 3000);
        if (!preg_match('/^[1-9]\d{0,11}$/D', $payload['jumlah'])) annahl_fail(422, 'Isi nominal donasi dengan angka yang valid.');
        if (!in_array($payload['metode'], ['Transfer Bank BSI','GoPay','OVO','DANA','QRIS'], true)) annahl_fail(422, 'Pilih metode pembayaran yang tersedia.');
    }
    return ['id'=>strtolower($id), 'kind'=>$kind, 'payload'=>$payload, 'files'=>annahl_files($input['files'] ?? [])] + ($kind === 'pendaftaran' ? ['periodYear'=>(int)$year] : []);
}

function annahl_forward(array $config, array $record): array {
    if (!function_exists('curl_init')) annahl_fail(503, 'Sambungan formulir belum siap.');
    $record['version'] = 1; $record['issuedAt'] = time();
    $data = json_encode($record, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_THROW_ON_ERROR);
    $body = json_encode(['data'=>$data, 'signature'=>hash_hmac('sha256', 'annahl.forms.v1:' . $data, $config['shared_secret'])], JSON_UNESCAPED_SLASHES | JSON_THROW_ON_ERROR);
    $url = $config['apps_script_url']; $method = 'POST';
    for ($hop = 0; $hop < 3; $hop++) {
        $location = '';
        $curl = curl_init($url);
        curl_setopt_array($curl, [CURLOPT_RETURNTRANSFER=>true, CURLOPT_FOLLOWLOCATION=>false, CURLOPT_CONNECTTIMEOUT=>12, CURLOPT_TIMEOUT=>75, CURLOPT_SSL_VERIFYPEER=>true, CURLOPT_SSL_VERIFYHOST=>2,
            CURLOPT_HTTPHEADER=>['Content-Type: application/json'], CURLOPT_CUSTOMREQUEST=>$method,
            CURLOPT_HEADERFUNCTION=>static function($curl, string $header) use (&$location): int { if (stripos($header, 'Location:') === 0) $location = trim(substr($header, 9)); return strlen($header); }]);
        if ($method === 'POST') curl_setopt($curl, CURLOPT_POSTFIELDS, $body);
        $response = curl_exec($curl); $status = curl_getinfo($curl, CURLINFO_RESPONSE_CODE); $failed = curl_errno($curl); curl_close($curl);
        if ($failed || $response === false) annahl_fail(502, 'Belum menerima konfirmasi Google. Coba kirim lagi dari halaman ini tanpa memuat ulang.');
        if ($status >= 300 && $status < 400) {
            $parts = parse_url($location);
            if (($status !== 302 && $status !== 303) || ($parts['scheme'] ?? '') !== 'https' || ($parts['host'] ?? '') !== 'script.googleusercontent.com' || isset($parts['user']) || isset($parts['pass'])) annahl_fail(502, 'Respons sambungan Google tidak valid.');
            $url = $location; $method = 'GET'; continue;
        }
        $receipt = json_decode($response, true);
        if ($status !== 200 || !is_array($receipt) || ($receipt['ok'] ?? false) !== true || ($receipt['id'] ?? '') !== $record['id'] || ($receipt['kind'] ?? '') !== $record['kind']) {
            $code = is_array($receipt) ? ($receipt['code'] ?? '') : '';
            if ($code === 'conflict') annahl_fail(409, 'Isi kiriman berubah. Muat ulang halaman sebelum mengirim data baru.');
            if ($code === 'busy') annahl_fail(503, 'Google sedang memproses kiriman lain. Coba lagi sebentar.');
            annahl_fail(502, 'Google belum mengonfirmasi penyimpanan. Coba lagi atau hubungi pengurus.');
        }
        return ['ok'=>true, 'id'=>$record['id'], 'kind'=>$record['kind']];
    }
    annahl_fail(502, 'Sambungan Google belum selesai. Coba lagi sebentar.');
}
