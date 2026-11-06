<?php
// Put the real file OUTSIDE public_html: ../annahl-private/forms-config.php.
// This example has no credentials. Never put a real secret in public/ or VITE_*.
return [
    'apps_script_url' => 'https://script.google.com/macros/s/DEPLOYMENT_ID/exec',
    'shared_secret' => 'PASTE_EXISTING_ANNAHL_SHEETS_SECRET_HERE',
    'supabase_url' => 'https://PROJECT_REF.supabase.co',
    'supabase_anon_key' => 'PUBLIC_ANON_OR_PUBLISHABLE_KEY',
    'allowed_origins' => ['https://pondokpesantrenpemberdayaanummatannahl.com', 'https://www.pondokpesantrenpemberdayaanummatannahl.com'],
    'rate_limit_directory' => __DIR__ . '/rate-limits',
    'submissions_per_hour' => 30,
];
