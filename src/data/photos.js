// ═══════════════════════════════════════════
// Foto asli dari folder picture/
// ═══════════════════════════════════════════

export function photo(relativePath) {
  return '/picture/' + relativePath.split('/').map(encodeURIComponent).join('/');
}

export const photos = {
  hero: {
    beranda: photo('Kegiatan santri-20260724T124803Z-1-001/Kegiatan santri/Acara pondok/20260208_172922.jpg'),
    tentang: photo('Kegiatan santri-20260724T124803Z-1-001/Kegiatan santri/Acara pondok/20260108_172045.jpg'),
    program: photo("Program Qur'an -20260724T124816Z-1-001/Program Qur_an/20260515_061438.jpg"),
    berita: photo('Kegiatan santri-20260724T124803Z-1-001/Kegiatan santri/Al kahfi day/20260515_054906.jpg'),
    galeri: photo('Kegiatan santri-20260724T124803Z-1-001/Kegiatan santri/Acara pondok/20260512_115312.jpg'),
    kontak: photo('Moment-Moment tamu-20260724T124807Z-1-001/Moment-Moment tamu/20260429_110144.jpg'),
    donasi: photo('PPDA & PPDU-20260724T124814Z-1-001/PPDA & PPDU/20260504_055128.jpg'),
    pendaftaran: photo('PPDA & PPDU-20260724T124814Z-1-001/PPDA & PPDU/20260430_125314.jpg'),
  },
  about: photo('Kegiatan santri-20260724T124803Z-1-001/Kegiatan santri/Acara pondok/20260111_215510.jpg'),
  program: {
    tahfidz: photo("Program Qur'an -20260724T124816Z-1-001/Program Qur_an/20260515_061540.jpg"),
    formal: photo('KEGIATAN Sekolah formal -20260724T124804Z-1-001/KEGIATAN Sekolah formal/VideoCapture_20260509-195534.jpg'),
    pemberdayaan: photo('PPDA & PPDU-20260724T124814Z-1-001/PPDA & PPDU/20260504_060403.jpg'),
  },
  tentang: {
    visi: photo('Kegiatan santri-20260724T124803Z-1-001/Kegiatan santri/Acara pondok/20260208_172900.jpg'),
    pengasuh: photo('Muhadloroh -20260724T124809Z-1-001/Muhadloroh/Khitobiyyah/Salinan 20251018_210225.jpg'),
  },
  beranda: {
    news1: photo("Program Qur'an -20260724T124816Z-1-001/Program Qur_an/20260515_061638.jpg"),
    news2: photo('Kegiatan santri-20260724T124803Z-1-001/Kegiatan santri/Al kahfi day/20260515_054956.jpg'),
    news3: photo('PPDA & PPDU-20260724T124814Z-1-001/PPDA & PPDU/20260430_124929.jpg'),
  },
  berita: {
    wisuda: photo("Program Qur'an -20260724T124816Z-1-001/Program Qur_an/VideoCapture_20260515-062014.jpg"),
    israMiraj: photo('Kegiatan santri-20260724T124803Z-1-001/Kegiatan santri/Al kahfi day/20260515_054836.jpg'),
    pendaftaran: photo('PPDA & PPDU-20260724T124814Z-1-001/PPDA & PPDU/20260504_055627.jpg'),
    baktiSosial: photo('PPDA & PPDU-20260724T124814Z-1-001/PPDA & PPDU/20260504_060515.jpg'),
    olimpiade: photo('KEGIATAN Sekolah formal -20260724T124804Z-1-001/KEGIATAN Sekolah formal/VideoCapture_20260509-195559.jpg'),
    khataman: photo('Kegiatan santri-20260724T124803Z-1-001/Kegiatan santri/Sholat jama_ah/20260508_204228.jpg'),
  },
};

export const galleryImages = [
  { src: photo("Program Qur'an -20260724T124816Z-1-001/Program Qur_an/20260515_061438.jpg"), alt: 'Program Tahfidz Al-Quran', category: 'Ibadah' },
  { src: photo('Program bahasa arab -20260724T124815Z-1-001/Program bahasa arab/20260508_080021.jpg'), alt: 'Program Bahasa Arab', category: 'Akademik' },
  { src: photo('KEGIATAN Sekolah formal -20260724T124804Z-1-001/KEGIATAN Sekolah formal/VideoCapture_20260509-195518.jpg'), alt: 'Kegiatan Sekolah Formal', category: 'Akademik' },
  { src: photo('Muhadloroh -20260724T124809Z-1-001/Muhadloroh/Kelas/20260503_205739.jpg'), alt: 'Kelas Muhadloroh', category: 'Akademik' },
  { src: photo('Kegiatan santri-20260724T124803Z-1-001/Kegiatan santri/Sholat jama_ah/20260508_203515.jpg'), alt: 'Sholat Jamaah', category: 'Ibadah' },
  { src: photo('Kegiatan santri-20260724T124803Z-1-001/Kegiatan santri/Al kahfi day/20260515_054817.jpg'), alt: 'Al Kahfi Day', category: 'Ibadah' },
  { src: photo('EKSKUL-20260724T124802Z-1-001/EKSKUL/Hadroh/20260502_190015.jpg'), alt: 'Ekstrakurikuler Hadroh', category: 'Ibadah' },
  { src: photo('EKSKUL-20260724T124802Z-1-001/EKSKUL/Marawis/20260514_162707.jpg'), alt: 'Ekstrakurikuler Marawis', category: 'Ibadah' },
  { src: photo('Kegiatan santri-20260724T124803Z-1-001/Kegiatan santri/Acara pondok/20260119_211522.jpg'), alt: 'Acara Pondok', category: 'Acara' },
  { src: photo('PPDA & PPDU-20260724T124814Z-1-001/PPDA & PPDU/20260430_125028.jpg'), alt: 'Program PPDA & PPDU', category: 'Acara' },
  { src: photo('Moment-Moment tamu-20260724T124807Z-1-001/Moment-Moment tamu/20260429_085350.jpg'), alt: 'Kunjungan Tamu', category: 'Acara' },
  { src: photo('Muhadloroh -20260724T124809Z-1-001/Muhadloroh/Khitobiyyah/Salinan 20251018_212802.jpg'), alt: 'Khitobiyyah Santri', category: 'Acara' },
  { src: photo('Peternakan An-Nahl -20260724T124811Z-1-001/Peternakan An-Nahl/Kambing/20260514_104628.jpg'), alt: 'Peternakan Kambing', category: 'Fasilitas' },
  { src: photo('Peternakan An-Nahl -20260724T124811Z-1-001/Peternakan An-Nahl/Perikanan/20260514_123525.jpg'), alt: 'Peternakan Perikanan', category: 'Fasilitas' },
  { src: photo('Peternakan An-Nahl -20260724T124811Z-1-001/Peternakan An-Nahl/Bebek/20260514_123237.jpg'), alt: 'Peternakan Bebek', category: 'Fasilitas' },
  { src: photo('EKSKUL-20260724T124802Z-1-001/EKSKUL/Futsal/20260206_174403.jpg'), alt: 'Ekstrakurikuler Futsal', category: 'Fasilitas' },
  { src: photo('EKSKUL-20260724T124802Z-1-001/EKSKUL/Silat/20260502_065839.jpg'), alt: 'Ekstrakurikuler Pencak Silat', category: 'Fasilitas' },
  { src: photo('EKSKUL-20260724T124802Z-1-001/EKSKUL/Melukis/20260513_094541.jpg'), alt: 'Ekstrakurikuler Melukis', category: 'Fasilitas' },
  { src: photo('Kegiatan santri-20260724T124803Z-1-001/Kegiatan santri/Makan/20260304_175452.jpg'), alt: 'Makan Bersama Santri', category: 'Fasilitas' },
  { src: photo('Kegiatan santri-20260724T124803Z-1-001/Kegiatan santri/Senam/IMG-20260417-WA0006.jpg'), alt: 'Senam Pagi Santri', category: 'Fasilitas' },
  { src: photo('Moment-Moment hiburan santri-20260724T124805Z-1-001/Moment-Moment hiburan santri/20260429_092133.jpg'), alt: 'Hiburan Santri', category: 'Acara' },
  { src: photo('Kegiatan santri-20260724T124803Z-1-001/Kegiatan santri/Bersih-bersih/VideoCapture_20260509-195550.jpg'), alt: 'Gotong Royong Bersih-bersih', category: 'Acara' },
];
