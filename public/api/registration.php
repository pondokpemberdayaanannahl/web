<?php
declare(strict_types=1);
// Reuse the verified admin session and signed Google transport; no photo keys are needed.
define('ANNAHL_MEDIA_ENTRY',true);
require __DIR__.'/media-core.php';
ini_set('display_errors','0');
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store, private');
header('X-Content-Type-Options: nosniff');
try {
    if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') annahl_fail(405,'Metode tidak tersedia.');
    if (($_SERVER['HTTP_X_ANNAHL_REGISTRATION'] ?? '') !== '1') annahl_fail(403,'Buka melalui menu Pendaftaran pada panel pengurus.');
    $config=annahl_config(); annahl_origin($config,$_SERVER);
    $user=media_user($config,$_SERVER);
    if ($user['role'] !== 'admin') annahl_fail(403,'Hanya admin dapat menyiapkan rekap penerimaan.');
    annahl_rate($config,hash('sha256',$user['id']),'registration-setup',30);
    if ((int)($_SERVER['CONTENT_LENGTH'] ?? 0) > 1000 || stripos($_SERVER['CONTENT_TYPE'] ?? '', 'application/json') !== 0) annahl_fail(422,'Format pengaturan belum sesuai.');
    try { $input=json_decode((string)file_get_contents('php://input',false,null,0,1001),true,4,JSON_THROW_ON_ERROR); }
    catch (JsonException) { annahl_fail(422,'Format pengaturan belum sesuai.'); }
    if (!is_array($input)) annahl_fail(422,'Format pengaturan belum sesuai.');
    $year=$input['year'] ?? null;
    if (!is_int($year) || $year<2000 || $year>2099 || count($input)!==1) annahl_fail(422,'Tahun penerimaan tidak valid.');
    $settings=annahl_registration_settings($config);
    if (($settings['registration']['year'] ?? null) !== $year) annahl_fail(409,'Tahun penerimaan sudah berubah. Muat ulang jadwal terlebih dahulu.');
    $reply=media_forward($config,['action'=>'registration-period','actor'=>$user['id'],'year'=>$year]);
    $sheetId=$reply['sheetId'] ?? null;
    if (($reply['year'] ?? null) !== $year || !is_int($sheetId) || $sheetId<0 || $sheetId>2147483647) annahl_fail(502,'Tab rekap belum dikonfirmasi. Deployment Apps Script perlu diperbarui oleh pengelola website.');
    $headers=['apikey: '.$config['supabase_anon_key'],'Authorization: '.$_SERVER['HTTP_AUTHORIZATION'],'Content-Type: application/json'];
    [$status,$body]=media_http($config['supabase_url'].'/rest/v1/rpc/confirm_registration_sheet','POST',$headers,json_encode(['p_year'=>$year,'p_sheet_id'=>$sheetId],JSON_THROW_ON_ERROR),40000,$config['curl_ca_file'] ?? null);
    if ($status===409) annahl_fail(409,'Periode penerimaan sudah berubah. Muat ulang jadwal.');
    $saved=json_decode($body,true);
    if ($status!==200 || ($saved['registration']['year'] ?? null)!==$year || ($saved['registration']['recap_ready'] ?? false)!==true || ($saved['registration']['recap_sheet_id'] ?? null)!==$sheetId) annahl_fail(502,'Tab rekap sudah disiapkan, tetapi jadwal belum diaktifkan. Tekan Siapkan rekap untuk mencoba lagi.');
    echo json_encode(['ok'=>true,'settings'=>$saved],JSON_THROW_ON_ERROR);
} catch (AnnahlFormError $error) { http_response_code($error->status); echo json_encode(['ok'=>false,'message'=>$error->getMessage()]); }
catch (Throwable) { http_response_code(503); echo json_encode(['ok'=>false,'message'=>'Rekap belum dapat disiapkan. Coba lagi atau hubungi pengelola website.']); }
