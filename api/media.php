<?php
declare(strict_types=1);
define('ANNAHL_MEDIA_ENTRY', true);
require __DIR__.'/media-core.php';
ini_set('display_errors', '0');
header('Content-Type: application/json; charset=utf-8'); header('Cache-Control: no-store, private'); header('X-Content-Type-Options: nosniff');
try {
    $method = $_SERVER['REQUEST_METHOD'] ?? '';
    if (!in_array($method, ['GET','POST'], true)) annahl_fail(405, 'Metode tidak tersedia.');
    if (($_SERVER['HTTP_X_ANNAHL_MEDIA'] ?? '') !== '1') annahl_fail(403, 'Buka melalui panel pengurus.');
    $config = media_config();
    if ($method === 'POST' || isset($_SERVER['HTTP_ORIGIN'])) annahl_origin($config,$_SERVER);
    elseif (!in_array($_SERVER['HTTP_SEC_FETCH_SITE'] ?? '', ['', 'same-origin','none'], true)) annahl_fail(403, 'Buka melalui panel pengurus.');
    $user = media_user($config,$_SERVER);
    annahl_rate($config, hash('sha256',$user['id']), 'media', 240);
    if ($method === 'GET') {
        $action = $_GET['action'] ?? 'list';
        if (!in_array($action,['list','status','resolve'],true)) annahl_fail(422,'Tindakan tidak tersedia.');
        $record = ['action'=>$action,'actor'=>$user['id'],'search'=>substr((string)($_GET['search'] ?? ''),0,100),'cursor'=>substr((string)($_GET['cursor'] ?? ''),0,2000)];
        if ($action === 'resolve') {
            $fileId = $_GET['fileId'] ?? '';
            if (!is_string($fileId) || !preg_match('/^[A-Za-z0-9_-]{10,200}$/D',$fileId)) annahl_fail(422,'Foto Drive yang dipilih tidak valid.');
            $record['fileId'] = $fileId;
        }
        $reply = media_forward($config,$record);
        if ($action === 'list') $reply['photos'] = array_map(static fn(array $row): array => media_row($config,$row), $reply['photos'] ?? []);
        if ($action === 'resolve') $reply['asset'] = isset($reply['asset']) ? media_row($config,$reply['asset']) : null;
        unset($reply['id']); echo json_encode($reply,JSON_THROW_ON_ERROR);
    } else {
        if (stripos($_SERVER['CONTENT_TYPE'] ?? '', 'application/json') !== 0 || (int)($_SERVER['CONTENT_LENGTH'] ?? 0) > 29000000) annahl_fail(413,'Ukuran foto melebihi batas.');
        $body = file_get_contents('php://input',false,null,0,29000001);
        if ($body === false || strlen($body) > 29000000) annahl_fail(413,'Ukuran foto melebihi batas.');
        try { $input = json_decode($body,true,12,JSON_THROW_ON_ERROR); } catch (JsonException) { annahl_fail(422,'Format unggahan tidak sesuai.'); }
        if (!is_array($input) || !in_array($input['variant'] ?? '',['original','full','thumbnail'],true)) annahl_fail(422,'Jenis foto tidak sesuai.');
        $assetId = media_id($input['assetId'] ?? null); $variant = $input['variant'];
        $record = ['action'=>'upload','actor'=>$user['id'],'assetId'=>$assetId,'variant'=>$variant,'name'=>annahl_text($input,'name',1,180),'folder'=>annahl_text($input,'folder',1,500),'file'=>media_validate_file($input,$variant)];
        $thumbnail = null;
        if (($input['layout'] ?? '') === 'single-file') {
            if ($variant !== 'full' || !is_string($input['sourceSha256'] ?? null) || !preg_match('/^[a-f0-9]{64}$/D', $input['sourceSha256'])) annahl_fail(422,'Identitas foto tidak sesuai.');
            $record['sourceSha256'] = $input['sourceSha256'];
            $ready = media_forward($config,['action'=>'status','actor'=>$user['id']]);
            if (($ready['layout'] ?? '') !== 'single-file') annahl_fail(503,'Penyimpanan foto perlu diperbarui. Minta pengelola memperbarui deployment Apps Script.');
            if (isset($input['thumbnail'])) $thumbnail = media_validate_file(['file'=>$input['thumbnail']],'thumbnail');
        }
        $reply = media_forward($config,$record);
        $reused = ($reply['reused'] ?? false) === true;
        $sameSource = isset($record['sourceSha256']) && ($reply['sourceSha256'] ?? '') === $record['sourceSha256'];
        $validHash = is_string($reply['sha256'] ?? null) && preg_match('/^[a-f0-9]{64}$/D',$reply['sha256']);
        if (!$validHash || ($reused ? !$sameSource : $reply['sha256'] !== $record['file']['sha256']) ||
            ($reply['variant'] ?? '') !== $variant || ($reply['asset']['id'] ?? '') !== $assetId) annahl_fail(502,'Tanda terima foto belum sesuai. Coba lagi.');
        if (!$reused) {
            if ($variant !== 'original') media_cache_store($config,$assetId,$variant,array_intersect_key($record['file'],array_flip(['mime','data','sha256'])));
            if ($thumbnail !== null) media_cache_store($config,$assetId,'thumbnail',array_intersect_key($thumbnail,array_flip(['mime','data','sha256'])));
        }
        echo json_encode(['ok'=>true,'asset'=>media_row($config,$reply['asset']),'variant'=>$variant,'sha256'=>$reply['sha256'],
            'reused'=>$reused,'sourceSha256'=>$reply['sourceSha256'] ?? null],JSON_THROW_ON_ERROR);
    }
} catch (AnnahlFormError $error) { http_response_code($error->status); echo json_encode(['ok'=>false,'message'=>$error->getMessage()]); }
catch (Throwable) { http_response_code(503); echo json_encode(['ok'=>false,'message'=>'Perpustakaan Drive belum dapat dibuka. Coba lagi atau hubungi admin proyek.']); }
