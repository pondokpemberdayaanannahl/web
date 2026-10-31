// Public information supplied by the pondok, updated 31 October 2026.
export const pondokContact = {
  address: 'Jln. Gunung Salak Endah No. 01, Kp. Pasar Kemis, RT/RW 003/003, Ds. Gunung Picung, Kec. Pamijahan, Kab. Bogor, Jawa Barat, Indonesia',
  phone: '0857-2000-0265',
  telephone: '+6285720000265',
  whatsapp: '6285720000265',
};
const mapQuery = encodeURIComponent(pondokContact.address);
// Search URL format: https://developers.google.com/maps/documentation/urls/get-started
export const pondokMapUrl = `https://www.google.com/maps/search/?api=1&query=${mapQuery}`;
export const pondokMapEmbed = `https://www.google.com/maps?q=${mapQuery}&output=embed`;

export const programPesantren = [
  { title: 'Program Tahfidz Quran', icon: 'book-open', description: 'Pembelajaran dan hafalan Al-Qur’an sebagai bagian dari pendidikan santri.' },
  { title: 'Pendidikan Madrasah Muhadloroh', icon: 'school', description: 'Pendidikan madrasah untuk memperdalam pemahaman keislaman santri.' },
  { title: 'Pendidikan Formal (SMP/SMA)', icon: 'graduation-cap', description: 'Pendidikan formal pada jenjang SMP dan SMA bersama pendidikan pesantren.' },
  { title: 'Tarbiyah Akhlak Islamiyah', icon: 'heart', description: 'Pembinaan akhlak Islami dalam proses belajar dan keseharian santri.' },
];

export const programUnggulan = [
  { title: 'Kajian kitab salaf', icon: 'library', description: 'Mempelajari kitab-kitab salaf untuk memperdalam ilmu agama.' },
  { title: 'Tahfidzul Quran', icon: 'book-open', description: 'Menghafal Al-Qur’an dan menjaga hafalan melalui muraja’ah.' },
  { title: 'Arabic English Language', icon: 'languages', description: 'Pembelajaran bahasa Arab dan Inggris untuk mengembangkan kemampuan berbahasa.' },
  { title: 'Life skill', icon: 'wrench', description: 'Pengembangan keterampilan sebagai bekal kemandirian santri.' },
];

export const ekstrakurikuler = [
  { title: 'Pramuka', icon: 'flag' },
  { title: 'AHS (An Nahl Hadroh Sholawat)', icon: 'music' },
  { title: 'Komputer', icon: 'laptop' },
  { title: 'Bela Diri (Khalifah Bumi)', icon: 'shield' },
  { title: 'Public Speaking', icon: 'mic' },
  { title: 'Multimedia', icon: 'camera' },
  { title: 'Perikanan', icon: 'fish' },
  { title: "Majelis Qira'atul Kutub", icon: 'book-open' },
  { title: "Jam'iyah Quro wal Huffaz", icon: 'book-open-check' },
  { title: 'Kewirausahaan', icon: 'store' },
  { title: 'Otomotif', icon: 'wrench' },
  { title: 'Melukis', icon: 'palette' },
  { title: 'Pertanian', icon: 'sprout' },
  { title: 'Peternakan', icon: 'paw-print' },
];
