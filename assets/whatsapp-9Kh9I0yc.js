function e(){return`
    <a href="https://wa.me/6285772821484?text=Assalamu'alaikum%2C%20saya%20ingin%20bertanya%20tentang%20Pesantren%20An-Nahl." target="_blank" rel="noopener noreferrer" class="wa-float" id="wa-float" aria-label="Chat WhatsApp">
      <svg viewBox="0 0 32 32" width="28" height="28" fill="white">
        <path d="M16.004 0h-.008C7.174 0 0 7.176 0 16.004c0 3.5 1.128 6.744 3.046 9.378L1.054 31.29l6.118-1.958A15.914 15.914 0 0016.004 32C24.826 32 32 24.826 32 16.004 32 7.176 24.826 0 16.004 0zm9.31 22.606c-.39 1.1-1.932 2.014-3.164 2.28-.844.178-1.944.32-5.652-1.214-4.746-1.962-7.8-6.78-8.034-7.094-.226-.314-1.886-2.512-1.886-4.792 0-2.28 1.194-3.402 1.618-3.868.39-.428 1.028-.624 1.64-.624.198 0 .376.01.536.018.47.02.706.048 1.016.788.388.926 1.332 3.248 1.448 3.484.118.236.234.546.078.86-.148.32-.278.52-.518.796-.236.278-.496.62-.708.832-.236.236-.482.492-.208.964.276.47 1.226 2.022 2.632 3.274 1.81 1.612 3.334 2.112 3.806 2.348.47.236.748.198 1.024-.118.278-.32 1.194-1.388 1.512-1.866.314-.47.632-.394 1.064-.236.434.156 2.756 1.3 3.226 1.536.47.236.788.354.904.548.118.198.118 1.1-.272 2.198z"/>
      </svg>
      <span class="wa-float-label">Chat Kami</span>
    </a>
    <style>
      .wa-float {
        position: fixed;
        bottom: 28px;
        right: 28px;
        z-index: 900;
        display: flex;
        align-items: center;
        gap: 10px;
        background: #25D366;
        color: white;
        padding: 14px 22px 14px 16px;
        border-radius: 100px;
        box-shadow: 0 4px 20px rgba(37, 211, 102, 0.4);
        text-decoration: none;
        transition: all 0.35s cubic-bezier(0.4, 0, 0.2, 1);
        font-family: var(--font-body);
      }
      .wa-float:hover {
        transform: translateY(-3px) scale(1.03);
        box-shadow: 0 8px 28px rgba(37, 211, 102, 0.5);
        color: white;
      }
      .wa-float:active {
        transform: translateY(0) scale(0.98);
      }
      .wa-float-label {
        font-size: 14px;
        font-weight: 600;
        letter-spacing: 0.2px;
        white-space: nowrap;
      }
      /* Pulse animation */
      .wa-float::before {
        content: '';
        position: absolute;
        inset: -4px;
        border-radius: 100px;
        background: #25D366;
        opacity: 0;
        z-index: -1;
        animation: waPulse 2.5s ease-in-out infinite;
      }
      @keyframes waPulse {
        0%, 100% { opacity: 0; transform: scale(1); }
        50% { opacity: 0.15; transform: scale(1.12); }
      }
      /* Mobile: icon only */
      @media (max-width: 768px) {
        .wa-float {
          padding: 16px;
          bottom: 20px;
          right: 20px;
        }
        .wa-float-label { display: none; }
      }
    </style>
  `}export{e as WhatsAppButton};