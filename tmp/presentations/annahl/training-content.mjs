export const training = [
  {
    title: 'Pelatihan Admin Website An-Nahl', time: 2, source: 'bagian 1–3 dan 24',
    say: 'Assalamu’alaikum warahmatullahi wabarakatuh. Terima kasih teman-teman sudah hadir. Hari ini kita akan belajar mengelola website An-Nahl yang sudah dibuat. Website ini menjadi tempat orang mengenal pondok, melihat kegiatan, mendaftar, berdonasi, dan menghubungi pengurus. Tugas kita sebagai admin adalah menjaga informasi itu tetap benar dan memperbaruinya saat ada perubahan.\n\nSetelah sesi ini, teman-teman diharapkan bisa masuk ke ruang pengurus, membuat berita, memperbarui informasi, dan menindaklanjuti kiriman. Kita akan melihat contoh, lalu mencoba bersama. Jadi tidak perlu menghafal semua tombol hari ini. Fokus dulu pada alurnya: siapkan, periksa, simpan, lalu cek hasilnya.',
    demo: ['Tampilkan slide pembuka, sapa peserta, lalu sampaikan target sesi.', 'Jika perlu, buka beranda publik selama sekitar 20 detik untuk memberi konteks.'],
    ask: 'Siapa yang sudah pernah mengunggah artikel atau mengelola akun media sosial?',
    answer: 'Gunakan jawaban untuk menyesuaikan tempo. Jika mayoritas baru, tunjukkan satu langkah lalu tunggu peserta.',
    transition: 'Kita mulai dengan mengenali ruang kerja dan pembagian tugasnya.'
  },
  {
    title: 'Kenali ruang kerja dan peran', time: 3, source: 'bagian 2, 10, 22',
    say: 'Ada halaman publik yang dilihat pengunjung, dan ada Ruang Pengurus untuk mengelolanya. Di dalam Ruang Pengurus, Ringkasan adalah halaman awal. Kita bisa melihat jumlah konten dan memakai tombol cepat untuk bekerja. Menu di sebelah kiri membantu kita memilih tugas. Berita untuk artikel, Galeri untuk dokumentasi, Isi website untuk informasi halaman, lalu Pesan masuk dan Rekap untuk kiriman.\n\nPerannya juga berbeda. Penulis menyiapkan dan mengedit draft berita miliknya. Admin meninjau serta menerbitkan berita, mengelola halaman, galeri, pesan, rekap, dan peran akun. Jadi kalau menu seorang Penulis lebih sedikit, itu sesuai pembagian aksesnya. Untuk hari ini, kita belajar dari sudut pandang tim Admin.',
    demo: ['Buka Ringkasan atau tunjukkan screenshot. Sorot menu kiri dan tombol Tulis berita.', 'Tunjukkan posisi Lihat website dan Kelola akun pengurus tanpa mengubah akun.'],
    ask: 'Kalau hanya ingin memperbaiki nomor kontak pondok, kita masuk ke Berita atau Isi website?',
    answer: 'Isi website, karena yang diubah adalah informasi halaman.',
    transition: 'Sebelum memakai menu-menu ini, pastikan kita masuk dengan akun yang benar.'
  },
  {
    title: 'Masuk dan mulai bekerja', time: 3, source: 'bagian 9 dan 23',
    say: 'Buka alamat domain website, lalu tambahkan /login.html. Masukkan email dan password akun pengurus, kemudian klik Masuk ke ruang pengurus. Setelah masuk, cek nama dan peran akun. Untuk pertama kali, pengelola akan menyiapkan akun dan memberikan tautan aktivasi. Buat password minimal sepuluh karakter. Kalau tautannya kedaluwarsa atau lupa password, hubungi pengelola karena halaman login belum menyediakan reset mandiri.\n\nSaat latihan, gunakan mode demo jika disediakan. Tanda Ruang demo berarti pekerjaan kita tidak masuk ke halaman publik. Keberhasilan di demo belum membuktikan penyimpanan produksi. Bila demo tidak tersedia, kita cukup menyimpan berita latihan sebagai draft. Untuk latihan menerbitkan atau mengubah galeri dan halaman, gunakan lingkungan latihan yang sudah disiapkan.',
    demo: ['Tunjukkan alamat /login.html dan letak isian email serta password.', 'Masuk tanpa memperlihatkan password di layar proyektor. Periksa nama, peran, serta penanda demo.'],
    ask: 'Sesudah login, dua hal apa yang harus kita cek sebelum mulai?',
    answer: 'Identitas/peran akun dan apakah sedang berada di demo atau produksi.',
    transition: 'Sekarang kita coba tugas yang paling sering dilakukan: membuat berita kegiatan.'
  },
  {
    title: 'Berita: tulis, cek, lalu terbitkan', time: 6, source: 'bagian 11–13',
    say: 'Klik Tulis berita. Buat judul yang jelas, pilih kategori, lalu tulis kegiatan apa, siapa yang terlibat, kapan, dan di mana. Misalnya judul Latihan: Kegiatan Tahfidz Pagi. Tambahkan foto dan keterangannya bila perlu. Setelah itu, buka Pratinjau supaya kita membaca hasil seperti pengunjung.\n\nAda perbedaan penting: Simpan draft menyimpan pekerjaan di website tetapi belum menampilkannya ke publik. Terbitkan berita membuatnya dapat dibaca pengunjung. Salinan otomatis di browser hanya bantuan pemulihan teks; kita tetap perlu menyimpan draft. Admin menerbitkan, sedangkan Penulis menyiapkan draft miliknya.\n\nUntuk mengedit, buka Berita lalu gunakan pencarian atau filter status. Berhati-hati saat mengedit berita yang sudah terbit: jika memilih Simpan draft, berita kembali menjadi draft dan tidak tampil di daftar publik. Setelah terbit, buka halaman publik dan muat ulang untuk mengecek hasil.',
    demo: ['Di demo: Tulis berita → judul latihan → kategori Keagamaan → dua paragraf → foto jika ada.', 'Klik Pratinjau, perbaiki satu kesalahan, lalu Simpan draft dan tunggu pesan berhasil.', 'Buka kembali melalui menu Berita. Tunjukkan Terbitkan berita di demo. Di produksi, pertahankan contoh sebagai draft.'],
    ask: 'Kalau draft sudah tersimpan, apakah pengunjung sudah bisa membacanya?',
    answer: 'Belum. Berita harus diterbitkan oleh Admin.',
    transition: 'Selain artikel, kita juga bisa menambahkan foto dan video kegiatan ke galeri.'
  },
  {
    title: 'Galeri: foto dan video kegiatan', time: 4, source: 'bagian 14–15',
    say: 'Pada Galeri, pilih Foto unggahan lalu Tambah foto. Isi judul dan kategori, pilih foto dari Drive atau perangkat, lalu simpan. Tunggu pengoptimalan foto selesai sebelum menyimpan. Sumber foto maksimal dua belas megabita; gunakan JPG, PNG, WebP, atau GIF. Bila ditolak, kecilkan berkas dan pilih ulang. Foto dari ponsel yang berformat HEIC perlu dikonversi dulu.\n\nUntuk video, masukkan tautan YouTube yang dapat dibuka pengunjung. Menu ini tidak menerima unggahan MP4. Foto unggahan dan video tidak memiliki tahap draft seperti berita; setelah penyimpanan berhasil, periksa galeri publik. Karena itu, latihan simpan galeri dilakukan di demo.\n\nAda juga Foto folder sebagai koleksi dokumentasi. Koleksi itu dapat dicari dan dilihat, tetapi sumbernya tidak dihapus lewat browser. Penghapusan postingan foto atau video tidak mempunyai Arsip untuk memulihkan kartu. Pastikan kartu yang dipilih sudah benar sebelum menghapus.',
    demo: ['Tunjukkan Galeri → Foto unggahan → Tambah foto. Pilih foto latihan di demo, isi judul dan kategori.', 'Tunjukkan tombol Simpan foto serta tab Video dan isian Link YouTube. Jangan hapus konten asli.'],
    ask: 'Untuk menambahkan video, kita mengunggah MP4 atau menempel tautan YouTube?',
    answer: 'Menempel tautan YouTube yang bisa diputar pengunjung.',
    transition: 'Kalau yang berubah adalah jadwal, biaya, atau kontak, kita memakai menu Isi website.'
  },
  {
    title: 'Perbarui informasi halaman', time: 5, source: 'bagian 16–18',
    say: 'Isi website dipakai untuk memperbarui informasi tanpa mengedit kode. Kita bisa mengatur Beranda, Tentang, Program, informasi pendaftaran, donasi, kontak, pengantar berita dan galeri, serta identitas footer dan WhatsApp. Pilih halaman, cari bagian yang sesuai, lalu klik Edit bagian.\n\nSetelah selesai mengisi, klik Selesai mengedit. Tombol itu baru menerapkan perubahan di editor. Lanjutkan dengan Simpan draft, cek Pratinjau desktop dan ponsel, kemudian Terbitkan perubahan. Kalau mengedit beberapa halaman, setiap halaman perlu disimpan dan diterbitkan masing-masing. Setelah terbit, buka halaman publik dan muat ulang.\n\nPerhatikan informasi seperti biaya, jadwal, nomor kontak, dan rekening. Gunakan data yang sudah disepakati pondok. Untuk QRIS, buka Informasi donasi, bagian Metode Pembayaran, lalu pilih gambar QRIS resmi. Setelah dipasang, cek kode dan tujuan pembayaran. Bagian tertentu bisa disembunyikan lalu dipulihkan, tetapi perubahan tampil setelah diterbitkan.',
    demo: ['Di demo: Isi website → pilih Beranda → Edit bagian → ubah satu teks contoh → Selesai mengedit.', 'Simpan draft → Pratinjau Desktop dan Ponsel → kembali ke editor. Tunjukkan Terbitkan perubahan di demo.', 'Sebutkan lokasi Kontak & lokasi dan Informasi donasi tanpa mengganti informasi asli.'],
    ask: 'Setelah menekan Selesai mengedit, apakah halaman publik langsung berubah?',
    answer: 'Belum. Simpan draft, tinjau, lalu Terbitkan perubahan.',
    transition: 'Website juga menerima kiriman. Kita perlu tahu tempat membaca dan menindaklanjutinya.'
  },
  {
    title: 'Tindak lanjuti pesan dan rekap', time: 4, source: 'bagian 19–21',
    say: 'Pesan kontak dibaca di Pesan masuk. Klik Lihat isian, baca kebutuhan pengirim, lalu hubungi melalui email atau nomor yang dicantumkan. Setelah ditangani, ubah status menjadi diproses atau selesai dan klik Simpan status. Mengubah status tidak mengirim balasan otomatis.\n\nPendaftaran dan konfirmasi donasi memakai Google Sheets. Buka menu rekap yang sesuai, lalu klik Edit / hapus rekap di Google Sheets dengan akun Google yang sudah diberi izin. Cek data serta lampiran sebelum menghubungi wali atau donatur. Jangan mengubah judul kolom, susunan, atau tab rekap tanpa koordinasi.\n\nKhusus donasi, cocokkan bukti dan nominal dengan penerimaan bank atau e-wallet. Formulir konfirmasi bukan verifikasi pembayaran. Rekap donasi dapat diekspor sebagai Excel untuk salinan kerja. Di screenshot demo, pesan masih kosong; kita gunakan contoh cerita, bukan menampilkan data pendaftar atau donatur.',
    demo: ['Tunjukkan lokasi Pesan masuk, Rekap pendaftaran, dan Rekap donasi. Gunakan data contoh bila ada.', 'Jelaskan satu contoh: wali bertanya syarat pendaftaran → balas lewat kontaknya → simpan status selesai.', 'Jika Google Sheets belum bisa dibuka, tunjukkan langkah dari screenshot/manual; jangan memperlihatkan data pribadi di proyektor.'],
    ask: 'Jika sebuah pesan kita ubah menjadi selesai, apakah pengirim otomatis menerima balasan?',
    answer: 'Tidak. Balasan dilakukan melalui kanal kontak pengirim.',
    transition: 'Berikutnya, kita pelajari pengaturan akun dan cara memperbaiki kesalahan.'
  },
  {
    title: 'Atur akses dan pulihkan pekerjaan', time: 3, source: 'bagian 13, 18, 22, 25',
    say: 'Di Kelola akun pengurus, Admin dapat mengatur peran dan status aktif pengurus lain. Peran Penulis untuk menyiapkan draft; Admin untuk pengelolaan penuh. Jangan mengubah akun sendiri lewat daftar ini. Akun baru dan tautan aktivasi disiapkan pengelola teknis. Izin website dan izin Google Sheets atau Drive diatur terpisah.\n\nKalau berita tidak sengaja dihapus, cari di Arsip, lalu Pulihkan ke draft. Periksa lagi sebelum diterbitkan. Untuk isi halaman, buka Riwayat penerbitan halaman dan pulihkan sebagai draft. Riwayat berita juga bisa memuat teks versi sebelumnya, tetapi tetap memakai foto saat ini. Ini berbeda dari galeri yang tidak punya Arsip.\n\nKalau penyimpanan ditolak karena ada pengurus lain yang mengedit, simpan salinan teks penting, buka versi terbaru, lalu sepakati perubahan. Jika ada kendala, catat menu, waktu, langkah terakhir, dan pesan yang muncul untuk dikirim ke pengelola.',
    demo: ['Tunjukkan daftar akun demo tanpa mengubah akses peserta.', 'Tunjukkan filter Arsip pada Berita dan lokasi Riwayat penerbitan halaman. Gunakan konten latihan jika mendemokan pemulihan.'],
    ask: 'Berita yang dipulihkan dari Arsip langsung terbit atau kembali menjadi draft?',
    answer: 'Kembali menjadi draft; perlu ditinjau dan diterbitkan lagi.',
    transition: 'Sekarang teman-teman mencoba sendiri. Kita mulai dari satu berita latihan.'
  },
  {
    title: 'Latihan: satu berita kegiatan', time: 7, source: 'bagian 11 dan 23–24; skenario latihan disusun untuk sesi ini',
    say: 'Sekarang silakan buat berita berjudul Latihan: Kegiatan Tahfidz Pagi. Pilih kategori Keagamaan. Tulis dua paragraf: paragraf pertama menjelaskan kegiatan, waktu, dan tempat; paragraf kedua menjelaskan manfaatnya. Gunakan data contoh. Tambahkan foto yang sudah disiapkan bila tersedia. Buka Pratinjau, lalu simpan draft.\n\nSetelah selesai, minta teman di sebelah mengecek judul, isi, kategori, dan foto. Temukan kembali draft lewat menu Berita. Untuk yang memakai demo, kita bisa lanjut mencoba menerbitkan di demo. Di produksi, biarkan berita latihan sebagai draft dan jangan terbitkan.\n\nTarget latihan ini adalah setiap peserta bisa menemukan draft kembali dan menjelaskan bedanya dengan berita terbit. Jika belum selesai, angkat tangan agar kita bantu dari langkah terakhir, bukan mengulang semuanya.',
    demo: ['Berikan 4 menit untuk bekerja, 2 menit untuk saling memeriksa dan koreksi, serta 1 menit untuk berbagi hasil.', 'Berkeliling atau minta peserta menyebutkan tombol terakhir yang dipakai. Dampingi peserta yang belum berhasil menyimpan.', 'Jika perangkat atau akun terbatas, latihan berpasangan: satu menjalankan, satu menjelaskan, lalu bertukar.'],
    ask: 'Tunjukkan draft kalian. Apa yang harus dilakukan sebelum berita ini boleh tampil untuk pengunjung?',
    answer: 'Cek fakta dan foto, tinjau pratinjau, lalu Admin menerbitkan dan memeriksa halaman publik.',
    transition: 'Kita tutup dengan kebiasaan kerja yang perlu dipakai setelah pelatihan ini.'
  },
  {
    title: 'Alur kerja setelah pelatihan', time: 3, source: 'bagian 24–27',
    say: 'Setelah sesi ini, gunakan urutan sederhana: periksa kiriman, perbarui informasi yang diperlukan, simpan, lalu cek hasil di halaman publik. Sebelum menerbitkan, cek nama, tanggal, ejaan, foto, dan tautan. Setelah selesai bekerja di perangkat bersama, simpan pekerjaan dan keluar dari akun.\n\nSebelum mulai bertugas, sepakati siapa yang menulis, siapa yang meninjau dan menerbitkan, serta siapa yang menangani pesan dan rekap. Untuk informasi penting seperti biaya, rekening, dan QRIS, pastikan ada sumber resmi dari pondok.\n\nTerima kasih sudah mencoba bersama. Kalau ada langkah yang terlupa, gunakan manual PDF dan panduan ini. Bila menemukan kendala, catat pesan yang muncul dan hubungi pengelola tanpa membagikan password atau data pribadi. Sebelum ditutup, bagian mana yang masih ingin dicoba ulang? Wassalamu’alaikum warahmatullahi wabarakatuh.',
    demo: ['Minta peserta menyebutkan kembali perbedaan draft dan terbit.', 'Tulis pembagian tugas yang disepakati tim. Berikan lokasi manual dan kontak pengelola yang benar saat sesi berlangsung.', 'Sediakan sekitar 1 menit untuk pertanyaan. Bila perlu penjelasan lebih panjang, lanjutkan diskusi setelah sesi utama.'],
    ask: 'Siapa penanggung jawab penulisan, penerbitan, serta pesan dan rekap di tim kita?',
    answer: 'Isi berdasarkan kesepakatan tim saat pelatihan; presentasi ini tidak menetapkan nama atau jadwal pengurus.',
    transition: 'Akhiri sesi setelah memastikan peserta tahu tugas berikutnya dan tempat meminta bantuan.'
  }
];
