<?php
// Save as ../annahl-private/media-config.php, next to the existing forms-config.php.
$settings = require __DIR__ . '/forms-config.php';
$settings['supabase_url'] = 'https://PROJECT_REF.supabase.co';
$settings['supabase_anon_key'] = 'PUBLIC_ANON_OR_PUBLISHABLE_KEY';
$settings['media_signing_key'] = 'PRESERVE_GENERATED_64_HEX_PHOTO_KEY';
$settings['media_cache_directory'] = __DIR__ . '/media-cache';
return $settings;
