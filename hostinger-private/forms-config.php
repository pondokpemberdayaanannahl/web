<?php
// Private configuration. Keep OUTSIDE public_html.
$settings = json_decode('{"apps_script_url":"","shared_secret":"5ae58db9cfd1d37c72ce69dfba3d9d93528dedddf322265c315658e152c6c852","allowed_origins":["https://pondokpesantrenpemberdayaanummatannahl.com","https://www.pondokpesantrenpemberdayaanummatannahl.com"],"submissions_per_hour":30}', true, 512, JSON_THROW_ON_ERROR);
$settings['rate_limit_directory'] = __DIR__ . '/rate-limits';
return $settings;
