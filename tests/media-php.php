<?php
declare(strict_types=1);
define('ANNAHL_MEDIA_ENTRY',true);
require __DIR__.'/../public/api/media-core.php';
function media_assert(bool $value): void { if (!$value) throw new RuntimeException('Media check failed.'); }
$id='11111111-2222-4333-8444-555555555555';
media_assert(media_id($id)===$id);
$config=['media_signing_key'=>str_repeat('a',64)];
media_assert(media_key($config,$id,'full')!==media_key($config,$id,'thumbnail'));
foreach(['../file','arbitrary-drive-file',''] as $bad){try{media_id($bad);throw new RuntimeException('ID accepted');}catch(AnnahlFormError $error){media_assert($error->status===422);}}
$png=base64_decode('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+j0E8AAAAASUVORK5CYII=');
$file=media_validate_file(['file'=>['name'=>'foto.png','data'=>base64_encode($png)]],'full');
media_assert($file['mime']==='image/png' && $file['sha256']===hash('sha256',$png));
try{media_validate_file(['file'=>['name'=>'fake.png','data'=>base64_encode('<script>bad</script>')]],'full');throw new RuntimeException('Non-image accepted');}catch(AnnahlFormError $error){media_assert($error->status===422);}
if (function_exists('imagecreatetruecolor')) {
    $large = imagecreatetruecolor(1600,800);
    ob_start(); imagepng($large); $bytes = ob_get_clean(); imagedestroy($large);
    $image = ['mime'=>'image/png','data'=>base64_encode($bytes),'sha256'=>hash('sha256',$bytes)];
    $preview = media_thumbnail($image);
    $dimensions = getimagesizefromstring(base64_decode($preview['data']));
    media_assert($dimensions[0] === 480 && $dimensions[1] === 240);
    media_assert(hash('sha256',base64_decode($preview['data'])) === $preview['sha256']);
    media_assert(media_thumbnail($preview) === $preview);
    media_assert(getimagesizefromstring($bytes)[0] === 1600);
}

echo "Media ID, signed image capabilities, hashing, and raster validation passed.\n";
