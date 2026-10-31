<?php
declare(strict_types=1);
define('ANNAHL_FORMS_ENTRY', true);
require dirname(__DIR__) . '/public/api/forms-core.php';
$checks = 0;
function verify(bool $condition, string $message): void { global $checks; if (!$condition) throw new RuntimeException($message); $checks++; }
function rejected(callable $operation, int $status): void { try { $operation(); } catch (AnnahlFormError $error) { verify($error->status === $status, 'Unexpected rejection status'); return; } throw new RuntimeException('Expected rejection'); }
$config = ['shared_secret'=>str_repeat('a',64), 'allowed_origins'=>['https://pondok.example']];
$tag = annahl_ip_tag($config,['REMOTE_ADDR'=>'127.0.0.1']);
$token = annahl_token($config,$tag,1792990000);
annahl_check_token($config,$tag,$token,1792990050); verify(true,'valid token');
rejected(fn()=>annahl_check_token($config,'other-ip',$token,1792990050),403);
rejected(fn()=>annahl_check_token($config,$tag,$token,1792994000),403);
rejected(fn()=>annahl_origin($config,['HTTP_ORIGIN'=>'https://another.example']),403);
verify(annahl_origin($config,['HTTP_ORIGIN'=>'https://pondok.example'])==='https://pondok.example','exact origin');

$donation = ['id'=>'11111111-2222-4333-8444-555555555555','kind'=>'donasi','payload'=>['nama'=>'Data Uji','jumlah'=>'12345','metode'=>'QRIS','program'=>'Donasi Umum','pesan'=>'Bukan pembayaran','unknown'=>'must not forward']];
$normalized = annahl_submission($donation);
verify(!isset($normalized['payload']['unknown']),'Unlisted fields must not leave hosting');
rejected(fn()=>annahl_submission(array_replace_recursive($donation,['payload'=>['jumlah'=>'0']])),422);
rejected(fn()=>annahl_submission(array_replace($donation,['kind'=>'kontak'])),422);
$registration = ['id'=>$donation['id'],'kind'=>'pendaftaran','payload'=>['nama'=>'Data Uji','tempatLahir'=>'Bandung','tanggalLahir'=>'2012-01-01','jenisKelamin'=>'Laki-laki','asalSekolah'=>'Sekolah Uji','program'=>"Tahfidz Al-Qur'an",'namaWali'=>'Wali Uji','noWA'=>'000000000000','email'=>'uji@example.invalid','alamat'=>'Data rekaan']];
verify(annahl_submission($registration)['payload']['noWA']==='000000000000','Phone stays text');
foreach(['Program Tahfidz Quran','Pendidikan Madrasah Muhadloroh','Pendidikan Formal (SMP/SMA)','Tarbiyah Akhlak Islamiyah'] as $program) {
    verify(annahl_submission(array_replace_recursive($registration,['payload'=>['program'=>$program]]))['payload']['program']===$program,'New registration program accepted');
}
rejected(fn()=>annahl_submission(array_replace_recursive($registration,['payload'=>['program'=>'Program tidak tersedia']])),422);
rejected(fn()=>annahl_submission(array_replace_recursive($registration,['payload'=>['tanggalLahir'=>'2012-02-31']])),422);
rejected(fn()=>annahl_submission(array_replace_recursive($registration,['payload'=>['email'=>'invalid']])),422);

$pdf = '%PDF-1.4 data uji';
$file = ['name'=>'uji.pdf','data'=>base64_encode($pdf)];
verify(annahl_files([$file])[0]['sha256']===hash('sha256',$pdf),'File hash and bytes preserved');
rejected(fn()=>annahl_files([['name'=>'uji.pdf','data'=>base64_encode('<?php echo 1;')]]),422);
rejected(fn()=>annahl_files([['name'=>'uji.exe','data'=>base64_encode($pdf)]]),422);
rejected(fn()=>annahl_files(array_fill(0,4,$file)),422);
rejected(fn()=>annahl_files([['name'=>'uji.pdf','data'=>base64_encode(str_repeat('x',2097153))]]),422);
$bigPdf = ['name'=>'uji.pdf','data'=>base64_encode('%PDF-'.str_repeat('x',2097147))];
rejected(fn()=>annahl_files([$bigPdf,$bigPdf,$bigPdf]),422);
$png = base64_decode('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jRZkAAAAASUVORK5CYII=');
verify(annahl_files([['name'=>'uji.png','data'=>base64_encode($png)]])[0]['mime']==='image/png','PNG is sniffed');
rejected(fn()=>annahl_files([['name'=>'uji.jpg','data'=>base64_encode($png)]]),422);

$temp = dirname(__DIR__) . '/.backend-backups/php-validation';
if (!is_dir($temp)) mkdir($temp,0700,true);
$zipFile = $temp . '/test-office.zip';
$zip = new ZipArchive(); $zip->open($zipFile,ZipArchive::CREATE|ZipArchive::OVERWRITE);
$zip->addFromString('[Content_Types].xml','<Types/>'); $zip->addFromString('word/document.xml','<document/>'); $zip->close();
$office = file_get_contents($zipFile); unlink($zipFile);
verify(annahl_files([['name'=>'uji.docx','data'=>base64_encode($office)]])[0]['mime']==='application/vnd.openxmlformats-officedocument.wordprocessingml.document','DOCX package validated');
rejected(fn()=>annahl_files([['name'=>'uji.xlsx','data'=>base64_encode($office)]]),422);
$rate = $config + ['rate_limit_directory'=>$temp . '/rates'];
annahl_rate($rate,$tag,'unit',2); annahl_rate($rate,$tag,'unit',2);
rejected(fn()=>annahl_rate($rate,$tag,'unit',2),429);
// Remove only the exact synthetic counter; keep all unrelated files intact.
unlink($temp . '/rates/unit-' . substr($tag,0,2) . '.json');
echo "PASS: $checks PHP validation checks; no external service contacted.\n";
