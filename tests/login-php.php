<?php
declare(strict_types=1);
define('ANNAHL_LOGIN_ENTRY', true);
require __DIR__ . '/../public/api/login-core.php';
$checks = 0;
function login_verify(bool $condition): void { global $checks; if (!$condition) throw new RuntimeException('Login test failed'); $checks++; }
function login_reject(callable $operation, int $status, ?string $message = null): void {
    try { $operation(); } catch (AnnahlFormError $error) { login_verify($error->status === $status && ($message === null || $message === $error->getMessage())); return; }
    throw new RuntimeException('Expected login failure');
}
$config = ['supabase_url' => 'https://abcdefghijklmnopqrst.supabase.co', 'supabase_anon_key' => 'sb_publishable_fixture', 'usernames' => ['admin.pondok' => 'private@example.org']];
$input = login_input(['username' => ' Admin.Pondok ', 'password' => ' original password ']);
login_verify($input === ['username' => 'admin.pondok', 'password' => ' original password ']);
foreach ([null, [], ['username'=>[], 'password'=>'x'], ['username'=>'admin', 'password'=>[]], ['username'=>'ab','password'=>'x'], ['username'=>'email@example.org','password'=>'x'], ['username'=>'admin','password'=>str_repeat('x',4097)] ] as $bad) login_reject(fn()=>login_input($bad),401,ANNAHL_LOGIN_INVALID);
$userId = '11111111-2222-4333-8444-555555555555';
$session = ['access_token'=>'access-fixture','refresh_token'=>'refresh-fixture','user'=>['id'=>$userId,'email'=>'private@example.org']];
$calls = [];
$transport = function($url,$method,$headers,$body,$ca) use (&$calls,$session): array {
    $calls[] = [$url,$method,$headers,$body];
    return count($calls) === 1 ? [200,json_encode($session)] : [200,json_encode([['role'=>'admin','active'=>true]])];
};
$result = login_authenticate($config,$input,$transport);
login_verify($result === ['ok'=>true,'access_token'=>'access-fixture','refresh_token'=>'refresh-fixture']);
login_verify(!str_contains(json_encode($result),'private@example.org'));
login_verify(json_decode($calls[0][3],true) === ['email'=>'private@example.org','password'=>' original password ']);
login_verify($calls[1][1] === 'GET' && in_array('Authorization: Bearer access-fixture',$calls[1][2],true));
foreach ([400,401,403,422] as $status) login_reject(fn()=>login_authenticate($config,$input,fn()=>[$status,'PRIVATE_DIAGNOSTIC']),401,ANNAHL_LOGIN_INVALID);
login_reject(fn()=>login_authenticate($config,$input,fn()=>[429,'rate limited']),429);
login_reject(fn()=>login_authenticate($config,$input,fn()=>[500,'private upstream error']),502);
login_reject(fn()=>login_authenticate($config,$input,fn()=>[200,'not json']),502);
foreach ([[], [['role'=>'admin','active'=>false]], [['role'=>'viewer','active'=>true]]] as $profiles) {
    $count = 0;
    $stub = function() use (&$count,$session,$profiles): array { return ++$count === 1 ? [200,json_encode($session)] : [200,json_encode($profiles)]; };
    login_reject(fn()=>login_authenticate($config,$input,$stub),401,ANNAHL_LOGIN_INVALID);
}
$unknownCalled = false;
$unknownTransport = function($url,$method,$headers,$body) use (&$unknownCalled): array {
    $unknownCalled = str_ends_with(json_decode($body,true)['email'],'@login.invalid'); return [400,'invalid credentials'];
};
login_reject(fn()=>login_authenticate($config,['username'=>'unknown','password'=>'x'],$unknownTransport),401,ANNAHL_LOGIN_INVALID);
login_verify($unknownCalled);
login_reject(fn()=>login_authenticate($config,['username'=>'unknown','password'=>'x'],fn()=>[200,json_encode($session)]),401,ANNAHL_LOGIN_INVALID);
$testDir = dirname(__DIR__) . '/tmp/login-config-test-' . bin2hex(random_bytes(5));
mkdir($testDir,0700,true);
$testFile = $testDir . '/config.php';
$previous = getenv('ANNAHL_LOGIN_CONFIG');
try {
    $valid = $config + ['shared_secret'=>str_repeat('a',64),'allowed_origins'=>['https://example.org']];
    putenv('ANNAHL_LOGIN_CONFIG=' . $testFile);
    file_put_contents($testFile,'<?php return ' . var_export($valid,true) . ';');
    login_verify(login_config()['usernames']['admin.pondok'] === 'private@example.org');
    $badConfigs = [
        array_replace($valid,['supabase_url'=>'http://abcdefghijklmnopqrst.supabase.co']),
        array_replace($valid,['supabase_anon_key'=>'sb_secret_fixture']),
        array_replace($valid,['supabase_anon_key'=>'header.' . rtrim(strtr(base64_encode('{"role":"service_role"}'),'+/','-_'),'=') . '.sig']),
        array_replace($valid,['usernames'=>['Admin'=>'private@example.org']]),
        array_replace($valid,['usernames'=>['admin'=>'not-an-email']]),
    ];
    foreach($badConfigs as $badConfig){
        file_put_contents($testFile,'<?php return ' . var_export($badConfig,true) . ';');
        login_reject(fn()=>login_config(),503);
    }
    putenv('ANNAHL_LOGIN_CONFIG=' . __DIR__ . '/../public/api/login.php');
    login_reject(fn()=>login_config(),503);
} finally {
    $previous === false ? putenv('ANNAHL_LOGIN_CONFIG') : putenv('ANNAHL_LOGIN_CONFIG=' . $previous);
    unlink($testFile); rmdir($testDir);
}
echo "PASS: $checks username login checks; credentials and email mappings stay server-side; no external service contacted.\n";
