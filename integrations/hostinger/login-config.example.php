<?php
// Save as ../annahl-private/login-config.php OUTSIDE public_html.
// Uses only the existing public Supabase key, never a service-role/secret key.
return [
    'supabase_url' => 'https://PROJECT_REF.supabase.co',
    'supabase_anon_key' => 'PUBLIC_ANON_OR_PUBLISHABLE_KEY',
    'shared_secret' => 'GENERATE_64_HEX_WITH_bin2hex_random_bytes_32',
    'allowed_origins' => ['https://pondokpesantrenpemberdayaanummatannahl.com', 'https://www.pondokpesantrenpemberdayaanummatannahl.com'],
    'rate_limit_directory' => __DIR__ . '/login-rate-limits',
    // Existing Auth emails, not new accounts. Password and permissions stay the same.
    // Usernames: lowercase, unique, 3–32 characters; letters, digits, dot, _ or -.
    'usernames' => [
        'admin' => 'GANTI_EMAIL_AKUN_ADMIN_YANG_SUDAH_ADA',
    ],
];
