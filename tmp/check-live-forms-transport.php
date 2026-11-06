<?php
declare(strict_types=1);
define('ANNAHL_MEDIA_ENTRY',true);
require dirname(__DIR__) . '/public/api/media-core.php';
$config = annahl_config();
// Intentionally incomplete: validation must reject this before storage is touched.
$probePayload = in_array('--large',$argv,true) ? ['invalidDiagnosticPadding'=>str_repeat('x',6*1024*1024)] : [];
$data = json_encode(['version'=>1,'issuedAt'=>time(),'id'=>'00000000-0000-4000-8000-000000000001','kind'=>'pendaftaran','payload'=>$probePayload,'files'=>[]], JSON_THROW_ON_ERROR);
$envelope = json_encode(['data'=>$data,'signature'=>hash_hmac('sha256','annahl.forms.v1:'.$data,$config['shared_secret'])], JSON_THROW_ON_ERROR);
$url=$config['apps_script_url']; $method='POST'; $body=$envelope;
for ($hop=0;$hop<3;$hop++) {
    [$status,$response,$location]=media_http($url,$method,['Content-Type: application/json'],$body,10000,$config['curl_ca_file'] ?? null);
    if (in_array($status,[302,303],true) && parse_url($location,PHP_URL_HOST)==='script.googleusercontent.com' && parse_url($location,PHP_URL_SCHEME)==='https') { $url=$location;$method='GET';$body=null;continue; }
    $result=json_decode($response,true);
    echo json_encode(['httpStatus'=>$status,'receiptCode'=>$result['code'] ?? null,'signatureAccepted'=>($result['code'] ?? null)==='invalid','requestBytes'=>strlen($envelope),'storageAttempted'=>false],JSON_THROW_ON_ERROR).PHP_EOL;
    exit(($result['code'] ?? null)==='invalid' ? 0 : 1);
}
exit(1);
