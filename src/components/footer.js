// ═══════════════════════════════════════════
// FOOTER Component
// ═══════════════════════════════════════════

export function Footer() {
  return `
    <footer class="footer">
      <div class="container">
        <div class="footer-grid">
          <!-- Brand -->
          <div class="footer-col">
            <div class="footer-brand-name">An-Nahl</div>
            <p class="footer-brand-desc">
              Pondok Pesantren Pemberdayaan Ummat An-Nahl. Mendidik generasi Qur'ani yang berilmu, berakhlak mulia, dan siap memberdayakan ummat.
            </p>
          </div>

          <!-- Navigation -->
          <div class="footer-col">
            <div class="footer-heading">Navigasi</div>
            <div class="footer-links">
              <a href="#/" class="footer-link">Beranda</a>
              <a href="#/tentang" class="footer-link">Tentang Kami</a>
              <a href="#/program" class="footer-link">Program</a>
              <a href="#/pendaftaran" class="footer-link">Pendaftaran</a>
              <a href="#/berita" class="footer-link">Berita</a>
              <a href="#/galeri" class="footer-link">Galeri</a>
              <a href="#/donasi" class="footer-link">Donasi</a>
              <a href="#/kontak" class="footer-link">Kontak</a>
            </div>
          </div>

          <!-- Contact -->
          <div class="footer-col">
            <div class="footer-heading">Kontak</div>
            <div class="footer-contact-item">
              <i data-lucide="map-pin" style="width:16px;height:16px"></i>
              <span>Jl. Pesantren Raya No. 1,<br>Desa Suka Maju, Kab. Bandung,<br>Jawa Barat 40375</span>
            </div>
            <div class="footer-contact-item">
              <i data-lucide="phone" style="width:16px;height:16px"></i>
              <span>0812-3456-7890</span>
            </div>
            <div class="footer-contact-item">
              <i data-lucide="mail" style="width:16px;height:16px"></i>
              <span>info@annahl.id</span>
            </div>
          </div>

          <!-- Social -->
          <div class="footer-col">
            <div class="footer-heading">Ikuti Kami</div>
            <div class="footer-social">
              <a href="#" class="footer-social-link" aria-label="Instagram">
                <i data-lucide="instagram" style="width:18px;height:18px"></i>
              </a>
              <a href="#" class="footer-social-link" aria-label="Facebook">
                <i data-lucide="facebook" style="width:18px;height:18px"></i>
              </a>
              <a href="#" class="footer-social-link" aria-label="YouTube">
                <i data-lucide="youtube" style="width:18px;height:18px"></i>
              </a>
              <a href="#" class="footer-social-link" aria-label="Twitter">
                <i data-lucide="twitter" style="width:18px;height:18px"></i>
              </a>
            </div>
          </div>
        </div>

        <div class="footer-bottom">
          <p class="footer-copyright">© 2026 Pondok Pesantren Pemberdayaan Ummat An-Nahl. Hak cipta dilindungi undang-undang.</p>
        </div>
      </div>
    </footer>
  `;
}
