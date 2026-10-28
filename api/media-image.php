<?php
declare(strict_types=1);
define('ANNAHL_MEDIA_ENTRY',true);
require __DIR__.'/media-core.php';
ini_set('display_errors','0');
try {
    if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'GET') annahl_fail(405,'Metode tidak tersedia.');
    $config = media_config(); $id = media_id($_GET['id'] ?? null); $variant = $_GET['size'] ?? '';
    if (!in_array($variant,['full','thumbnail'],true) || !is_string($_GET['key'] ?? null) || !hash_equals(media_key($config,$id,$variant),$_GET['key'])) annahl_fail(404,'Foto belum tersedia.');
    $cache = $config['media_cache_directory'].'/'.$id.'-'.$variant.'.json';
    $image = is_file($cache) && filemtime($cache) > time()-86400 ? json_decode(file_get_contents($cache),true) : null;
    if (!$image) {
        annahl_rate($config,annahl_ip_tag($config,$_SERVER),'media-image',600);
        $reply = media_forward($config,['action'=>'image','actor'=>'website','assetId'=>$id,'variant'=>$variant]);
        $image = ['mime'=>$reply['mime'] ?? '', 'data'=>$reply['data'] ?? '', 'sha256'=>$reply['sha256'] ?? ''];
    }
    if (!in_array($image['mime'] ?? '',['image/jpeg','image/png','image/webp','image/gif'],true) || !is_string($image['data'] ?? null) || strlen($image['data']) > 2800000) annahl_fail(502,'Format foto tidak sesuai.');
    $bytes = base64_decode($image['data'],true);
    if ($bytes === false || !strlen($bytes) || strlen($bytes) > 2097152 || !hash_equals($image['sha256'] ?? '',hash('sha256',$bytes))) annahl_fail(502,'Foto belum dapat dimuat.');
    if (!is_file($cache) || filemtime($cache) <= time()-86400) {
        media_cache_store($config,$id,$variant,$image);
    }
    header('Content-Type: '.$image['mime']); header('X-Content-Type-Options: nosniff'); header('Referrer-Policy: no-referrer'); header('Cache-Control: public, max-age=3600'); header('ETag: "'.$image['sha256'].'"'); header('Content-Length: '.strlen($bytes));
    echo $bytes;
} catch (AnnahlFormError $error) { http_response_code($error->status); header('Cache-Control: no-store'); }
catch (Throwable) { http_response_code(503); header('Cache-Control: no-store'); }
