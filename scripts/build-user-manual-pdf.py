"""Build the illustrated PDF from the manual and locally captured screenshots.

Run: python scripts/build-user-manual-pdf.py
Screenshots are genuine browser captures. PDF clipping removes browser chrome;
the original capture files remain unchanged.
"""
from pathlib import Path
import re
import html
import json
from PIL import Image as PILImage
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.lib import colors
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.enums import TA_LEFT
from reportlab.lib.pagesizes import A4
from reportlab.platypus import (
    BaseDocTemplate, PageTemplate, Frame, Paragraph, Spacer, PageBreak,
    Table, TableStyle, KeepTogether, Flowable, Image,
)
from reportlab.platypus.tableofcontents import TableOfContents
from reportlab.lib.utils import ImageReader

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'output' / 'pdf'
SHOTS = OUT / 'screenshots'
OUT.mkdir(parents=True, exist_ok=True)
PDF = OUT / 'Panduan_Pengguna_An-Nahl_2026-10-30.pdf'
pdfmetrics.registerFont(TTFont('Segoe', 'C:/Windows/Fonts/segoeui.ttf'))
pdfmetrics.registerFont(TTFont('Segoe-Bold', 'C:/Windows/Fonts/segoeuib.ttf'))
pdfmetrics.registerFontFamily('Segoe', normal='Segoe', bold='Segoe-Bold', italic='Segoe', boldItalic='Segoe-Bold')
GREEN = colors.HexColor('#166534')
DARK = colors.HexColor('#163d28')
INK = colors.HexColor('#263d30')
MUTED = colors.HexColor('#56675c')
PALE = colors.HexColor('#eff6ec')
LINE = colors.HexColor('#d7e4d5')
GOLD = colors.HexColor('#c59a42')
W, H = A4
CW = W - 90

styles = {
    'body': ParagraphStyle('body', fontName='Segoe', fontSize=10.2, leading=15.1,
                           textColor=INK, spaceAfter=8, splitLongWords=True),
    'h1': ParagraphStyle('h1', fontName='Segoe-Bold', fontSize=22, leading=28,
                         textColor=DARK, spaceAfter=14, keepWithNext=True),
    'h2': ParagraphStyle('h2', fontName='Segoe-Bold', fontSize=13, leading=18,
                         textColor=GREEN, spaceBefore=14, spaceAfter=8, keepWithNext=True),
    'small': ParagraphStyle('small', fontName='Segoe', fontSize=8.2, leading=11.8,
                            textColor=MUTED, spaceAfter=8),
    'caption': ParagraphStyle('caption', fontName='Segoe', fontSize=8.5, leading=12,
                              textColor=MUTED, spaceAfter=10),
    'table': ParagraphStyle('table', fontName='Segoe', fontSize=8.8, leading=12.8,
                            textColor=INK),
    'tablehead': ParagraphStyle('tablehead', fontName='Segoe-Bold', fontSize=9,
                                leading=13, textColor=GREEN),
    'step': ParagraphStyle('step', fontName='Segoe', fontSize=10.2, leading=15.1,
                           leftIndent=23, firstLineIndent=0, bulletIndent=0,
                           textColor=INK, spaceAfter=7),
    'cover': ParagraphStyle('cover', fontName='Segoe-Bold', fontSize=37, leading=44,
                            textColor=DARK, spaceAfter=16),
    'label': ParagraphStyle('label', fontName='Segoe-Bold', fontSize=9, leading=13,
                            textColor=GREEN, spaceAfter=9),
}

def clean(s):
    return (s.replace('—', '-').replace('–', '-').replace('\u2011', '-')
             .replace('→', ' > ').replace('↗', '').replace('↓', '')
             .replace('↑', '').replace('…', '...').replace('**\\***', '*'))

def inline(s):
    saved = []
    def keep(value):
        saved.append(value)
        return f'ZZTOKEN{len(saved)-1}ZZ'
    s = re.sub(r'`([^`]+)`', lambda m: keep('<font color="#166534">' + html.escape(clean(m[1])) + '</font>'), s)
    s = html.escape(clean(s)).replace('&lt;br/&gt;', '<br/>')
    # Local Markdown references are written as names in a standalone PDF.
    s = re.sub(r'\[([^\]]+)\]\(([^)]+)\)', lambda m: m[1], s)
    s = re.sub(r'\*\*(.+?)\*\*', r'<b>\1</b>', s)
    s = s.replace('\\*', '*')
    for i, value in enumerate(saved):
        s = s.replace(f'ZZTOKEN{i}ZZ', value)
    return s

def p(text, style='body'):
    return Paragraph(inline(text), styles[style])

def note(title, text):
    cell = Paragraph('<b>' + html.escape(title) + '</b><br/>' + inline(text), styles['body'])
    box = Table([[cell]], colWidths=[CW], hAlign='LEFT')
    box.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), PALE), ('BOX',(0,0),(-1,-1),.5,LINE),
        ('LINEBEFORE',(0,0),(0,-1),3,GREEN), ('LEFTPADDING',(0,0),(-1,-1),12),
        ('RIGHTPADDING',(0,0),(-1,-1),12),('TOPPADDING',(0,0),(-1,-1),10),
        ('BOTTOMPADDING',(0,0),(-1,-1),5),
    ]))
    return [box, Spacer(1,12)]

class Screenshot(Flowable):
    def __init__(self, filename, crop=None, markers=(), maxheight=330, maxwidth=CW):
        super().__init__()
        self.path = SHOTS / (filename + '.png')
        self.image = ImageReader(str(self.path))
        self.iw, self.ih = self.image.getSize()
        self.crop = crop or (5, 82, self.iw-12, self.ih-7)
        x0,y0,x1,y1 = self.crop
        self.scale = min(maxwidth/(x1-x0), maxheight/(y1-y0))
        self.width, self.height = (x1-x0)*self.scale, (y1-y0)*self.scale
        self.markers = markers
        self.hAlign='CENTER'
    def draw(self):
        c = self.canv
        x0,y0,x1,y1=self.crop
        c.saveState()
        path=c.beginPath();path.rect(0,0,self.width,self.height)
        c.clipPath(path,stroke=0,fill=0)
        c.drawImage(self.image,-x0*self.scale,-(self.ih-y1)*self.scale,
                    self.iw*self.scale,self.ih*self.scale)
        c.restoreState()
        c.setStrokeColor(LINE);c.setLineWidth(.6);c.rect(0,0,self.width,self.height)
        for number,x,y in self.markers:
            px,py=(x-x0)*self.scale,(y1-y)*self.scale
            c.setFillColor(GREEN);c.setStrokeColor(colors.white);c.setLineWidth(1.5)
            c.circle(px,py,9,stroke=1,fill=1)
            c.setFont('Segoe-Bold',9);c.setFillColor(colors.white)
            c.drawCentredString(px,py-3,str(number))

FIGURES = []
def figure(filename, title, legend='', crop=None, markers=(), maxheight=330):
    number=len(FIGURES)+1
    FIGURES.append({'number':number,'file':filename,'caption':title})
    img=Screenshot(filename,crop,markers,maxheight)
    caption=f'<b>Gambar {number:02d}.</b> {html.escape(clean(title))}'
    if legend: caption+='<br/>'+inline(legend)
    return [KeepTogether([Spacer(1,5),img,Spacer(1,7),Paragraph(caption,styles['caption'])])]

GROUPS = [
    (1,'A','Mulai dan navigasi'),(4,'B','Panduan pengunjung'),
    (9,'C','Akun dan pengelolaan berita'),(14,'D','Foto, video, dan Drive'),
    (16,'E','Editor isi website'),(19,'F','Kiriman dan akses pengurus'),
    (24,'G','Operasional dan bantuan'),
]
def group(n):
    return next((letter,title) for start,letter,title in reversed(GROUPS) if n>=start)

GOALS = {
    1:'Pilih tutorial sesuai kebutuhan Anda. Pengunjung tidak perlu login untuk menggunakan halaman publik.',
    2:'Kenali menu utama dan perbedaan hak akses sebelum mulai menggunakan fitur.',
    3:'Temukan informasi pondok, program pendidikan, pendaftaran, berita, galeri, donasi, dan kontak.',
    4:'Isi data calon santri dan wali, pilih lampiran, lalu tunggu pemberitahuan pengiriman.',
    5:'Pilih kategori berita dan buka artikel yang sudah diterbitkan pengurus.',
    6:'Saring foto, perbesar dokumentasi, dan putar video kegiatan.',
    7:'Pilih program, baca tujuan pembayaran, lalu kirim konfirmasi setelah membayar.',
    8:'Gunakan kanal kontak atau formulir pesan untuk menyampaikan kebutuhan kepada pengurus.',
    9:'Masuk dengan akun yang aktif, selesaikan aktivasi jika diperlukan, dan keluar setelah selesai.',
    10:'Kenali ringkasan jumlah konten dan tombol cepat untuk memulai pekerjaan.',
    11:'Siapkan berita, tinjau, lalu simpan sebagai draft atau terbitkan sesuai hak akses.',
    12:'Temukan postingan melalui pencarian dan filter, kemudian perbarui kontennya.',
    13:'Pulihkan berita dari Arsip atau ambil teks dari versi sebelumnya.',
    14:'Telusuri foto folder, buat postingan foto, dan tambahkan video melalui tautan YouTube.',
    15:'Gunakan foto yang tersedia di perpustakaan atau unggah sumber baru sesuai batas editor.',
    16:'Pilih halaman, edit bagian, simpan draft, periksa pratinjau, lalu terbitkan.',
    17:'Sembunyikan bagian yang belum dibutuhkan dan pasang gambar QRIS resmi melalui editor.',
    18:'Pahami salinan lokal, pemulihan riwayat, dan cara menangani perubahan oleh pengurus lain.',
    19:'Baca isian kontak, tindak lanjuti pengirim, dan simpan status pekerjaan.',
    20:'Buka rekap pendaftaran di akun Google yang memiliki akses dan periksa data serta lampiran.',
    21:'Cocokkan konfirmasi dengan dana yang diterima dan unduh ekspor rekap bila diperlukan.',
    22:'Atur peran serta status aktif pengurus lain melalui akun Admin.',
    23:'Bedakan lingkungan latihan dari website produksi sebelum menilai hasil penyimpanan.',
    24:'Gunakan pemeriksaan singkat sebelum menerbitkan, menindaklanjuti, atau meninggalkan panel.',
    25:'Cari gejala kendala pada tabel dan lakukan langkah perbaikan yang sesuai.',
    26:'Ikuti contoh urutan kerja yang paling sering dilakukan Penulis dan Admin.',
    27:'Kenali batas fitur dan dokumen teknis yang perlu digunakan saat memasang atau memperbaiki layanan.',
}

def primary(n):
    if n==2:
        return figure('01-beranda','Navigasi utama dan pintasan dari Beranda.',
                      '1 Menu halaman. 2 Daftar Sekarang. 3 Chat Kami untuk membuka WhatsApp.',
                      markers=[(1,955,170),(2,360,790),(3,1670,930)])
    if n==3:return figure('02-tentang','Halaman Tentang: pengantar, visi misi, dan profil pondok.')
    if n==4:return figure('04-pendaftaran-alur','Awali pendaftaran dengan membaca alur dan persyaratannya.')
    if n==5:return figure('07-berita-publik','Kategori berita pada pratinjau lokal.',
                          'Pilih Semua berita atau kartu kategori. Pada sesi lokal ini layanan berita publik tidak dihubungkan; daftar artikel produksi tidak ditampilkan.',
                          crop=(360,590,1540,985),markers=[(1,1048,673),(2,610,769)],maxheight=230)
    if n==6:return figure('08-galeri-publik','Filter kategori dan foto kegiatan.',
                          '1 Pilih kategori. 2 Klik foto untuk memperbesar. Tombol muat lainnya muncul bila masih ada hasil.',
                          crop=(360,260,1540,1019),markers=[(1,936,478),(2,560,684)],maxheight=330)
    if n==7:return []
    if n==8:return figure('13-kontak','Kanal komunikasi dan formulir Kirim Pesan.',
                          '1 Pilihan kanal kontak. 2 Formulir pesan. Informasi pada gambar mengikuti isi bawaan lokal; gunakan kontak resmi yang telah dikonfirmasi pondok.',
                          crop=(360,240,1540,1018),markers=[(1,410,344),(2,1454,350)],maxheight=230)
    if n==9:return figure('14-login','Masuk melalui alamat /login.html.',
                          '1 Isi email akun produksi. 2 Isi password. 3 Klik Masuk ke ruang pengurus.',
                          crop=(1195,325,1600,790),markers=[(1,1199,516),(2,1199,607),(3,1199,675)],maxheight=355)
    if n==10:return figure('15-ringkasan-admin','Ringkasan pengurus dalam sesi demo.',
                           '1 Menu pengelolaan. 2 Tindakan cepat. 3 Jumlah konten. Data pada gambar adalah contoh latihan.',
                           markers=[(1,235,350),(2,1066,647),(3,1069,412)])
    if n==11:return figure('16-editor-berita','Editor berita yang diisi contoh latihan.',
                           '1 Judul dan kategori. 2 Isi dan format tulisan. 3 Pratinjau, Simpan draft, atau Terbitkan berita.',
                           crop=(610,126,1295,982),markers=[(1,1267,303),(2,1267,566),(3,1267,939)],maxheight=370)
    if n==12:return figure('19-berita-daftar','Pencarian, filter kategori/status, dan tindakan per postingan.',
                           '1 Cari judul. 2 Pilih kategori dan status. 3 Lihat postingan, Edit, Riwayat, atau Hapus.',
                           crop=(380,250,1765,1015),markers=[(1,1280,429),(2,1570,392),(3,719,700)],maxheight=300)
    if n==13:return figure('20-riwayat-berita','Riwayat berita pada contoh draft.',
                           'Gunakan versi ini memuat kembali teks untuk ditinjau. Foto saat ini tetap dipakai.',
                           crop=(582,365,1326,746),markers=[(1,778,673)],maxheight=235)
    if n==14:return figure('21-galeri-folder','Perpustakaan foto folder beserta pencarian dan filter.',
                           '1 Pilih Foto folder, Foto unggahan, atau Video. 2 Cari/filter/urutkan. 3 Foto Drive dan tombol unggah/tambah.',
                           markers=[(1,791,425),(2,1559,686),(3,1556,264)],maxheight=285)
    if n==15:return figure('17-pemilih-drive-demo','Pemilih foto pada mode demo.',
                           '1 Cari foto atau kegiatan. 2 Klik foto untuk memilih. Pada akun asli pemilih membaca perpustakaan Drive; gambar ini menggunakan koleksi lokal demo.',
                           crop=(530,129,1380,979),markers=[(1,1240,310),(2,1068,415)],maxheight=370)
    if n==16:return figure('24-isi-website','Pilih halaman yang ingin diperbarui melalui Isi website.',
                           'Postingan berita serta foto/video tetap dikelola melalui menu Berita dan Galeri.',maxheight=285)
    if n==17:return figure('29-cms-riwayat-bagian','Kartu bagian informasi serta akses riwayat halaman.',
                           '1 Hapus bagian tersedia pada bagian tertentu. 2 Bagian pembayaran inti dipertahankan. 3 Riwayat penerbitan halaman.',
                           crop=(380,245,1763,950),markers=[(1,1330,400),(2,985,704),(3,650,896)],maxheight=280)
    if n==18:return figure('29-cms-riwayat-bagian','Letak Riwayat penerbitan halaman pada bagian bawah editor.',
                           'Buka judul riwayat, lalu Muat riwayat. Riwayat produksi hanya dapat dibaca Admin; sesi demo tidak memiliki riwayat penerbitan tersimpan.',
                           crop=(380,856,1765,953),markers=[(1,700,897)],maxheight=105)
    if n==19:return figure('31-pesan-masuk-demo','Lokasi Pesan masuk pada Ruang Pengurus.',
                           'Gambar menampilkan sesi demo yang kosong. Pada akun produksi, kiriman menyediakan Lihat isian, pilihan status, dan Simpan status. Data pribadi tidak dimuat untuk screenshot ini.',maxheight=260)
    if n in (20,21):return figure('31-pesan-masuk-demo','Letak menu Rekap pendaftaran dan Rekap donasi.',
                           'Screenshot hanya memperlihatkan navigasi demo. Ikuti tutorial di bawah untuk akun produksi; rekap Google dan data kiriman nyata tidak dibuka saat penyusunan.',
                           crop=(5,470,243,720),markers=[(1,220,550),(2,220,645)],maxheight=190)
    if n==22:return figure('32-akun-pengurus','Peran dan status aktif akun pada mode demo.',
                           '1 Akun sendiri dilindungi. 2 Peran pengurus lain. 3 Status Aktif. 4 Simpan perubahan.',
                           crop=(590,380,1333,730),markers=[(1,1320,597),(2,1022,684),(3,1195,650),(4,1318,686)],maxheight=250)
    if n==23:return figure('15-ringkasan-admin','Penanda Ruang demo pada bagian atas panel.',
                           'Mode demo tidak menerbitkan tulisan ke website publik dan tidak mengirim foto ke Google.',
                           crop=(380,177,1768,247),maxheight=80)
    return []

def supplemental(n, heading):
    items=[]
    if n==4 and heading.startswith('4.1'):
        items+=figure('05-pendaftaran-data','Bagian Data Calon Santri.',
                      'Isi nama, tempat/tanggal lahir, jenis kelamin, asal sekolah, dan program. Formulir pada gambar belum dikirim.',
                      crop=(590,250,1320,1010),maxheight=300)
    if n==4 and heading.startswith('4.2'):
        items+=figure('06-pendaftaran-wali','Data wali dan alamat sebelum memilih lampiran.',
                      'Periksa nomor WhatsApp yang aktif. Gulir ke bawah untuk Dokumen pendukung.',
                      crop=(590,396,1320,1019),maxheight=220)
    if n==6 and heading=='Video':
        items+=figure('09-galeri-perbesar','Contoh pembesaran foto setelah diklik.',
                      'Tutup melalui tanda silang, area luar, atau Esc. Pemutar video berada pada bagian berikutnya di halaman Galeri.',maxheight=260)
    if n==7 and heading.startswith('7.1'):
        items+=figure('11-donasi-popup','Popup berisi petunjuk metode pembayaran.',
                      '1 Pilih metode. 2 Salin nomor jika diperlukan. 3 Lanjut konfirmasi setelah membayar. Nomor pada screenshot berasal dari isi bawaan lokal dan tidak boleh dijadikan tujuan transfer tanpa konfirmasi pondok.',
                      crop=(675,226,1246,883),markers=[(1,1204,458),(2,1009,691),(3,1200,831)],maxheight=350)
    if n==7 and heading.startswith('7.2'):
        items+=figure('12-donasi-konfirmasi','Konfirmasi donasi setelah melakukan pembayaran.',
                      '1 Periksa program dan metode. 2 Pilih bukti transfer. 3 Kirim konfirmasi. Notifikasi diterima belum merupakan verifikasi pembayaran.',
                      crop=(641,163,1265,928),markers=[(1,1257,430),(2,1257,702),(3,1257,899)],maxheight=355)
    if n==11 and heading=='Tiga tingkat penyimpanan':
        items+=figure('18-pratinjau-berita','Pratinjau isi artikel sebelum menyimpan.',
                      'Tutup pratinjau untuk kembali ke editor dan memilih Simpan draft atau Terbitkan berita.',
                      crop=(582,380,1325,729),maxheight=190)
    if n==14 and heading.startswith('14.2'):
        items+=figure('22-editor-foto','Editor Tambah foto.',
                      '1 Judul/kategori. 2 Pilih foto Drive atau unggah berkas. 3 Keterangan dan Simpan foto.',
                      crop=(620,178,1303,930),markers=[(1,1288,355),(2,1288,561),(3,1288,778)],maxheight=365)
    if n==14 and heading.startswith('14.3'):
        items+=figure('23-editor-video','Editor Tambah video menggunakan tautan YouTube.',
                      'Lengkapi judul, kategori, dan Link YouTube, lalu Simpan video.',
                      crop=(620,288,1302,822),markers=[(1,1287,670),(2,853,780)],maxheight=280)
    if n==17 and heading=='Memasang gambar QRIS resmi':
        items+=figure('30-cms-qris','Isian Gambar QRIS resmi pada editor Metode Pembayaran.',
                      '1 Pilih gambar QRIS resmi. 2 Klik Selesai mengedit, kemudian simpan dan terbitkan dari halaman pengelolaan. Ikon gambar kosong pada contoh menunjukkan QRIS belum dipasang.',
                      crop=(595,490,1312,978),markers=[(1,1239,800),(2,1118,940)],maxheight=285)
    return items

class ManualDoc(BaseDocTemplate):
    def __init__(self, path):
        super().__init__(str(path), pagesize=A4, leftMargin=45, rightMargin=45,
                         topMargin=58, bottomMargin=47, title='Panduan Pengguna Website An-Nahl - 30 Oktober 2026',
                         author='An-Nahl', subject='Manual bergambar untuk pengunjung dan pengurus',
                         pageCompression=1)
        frame=Frame(45,47,CW,H-105,id='body',leftPadding=0,rightPadding=0,topPadding=0,bottomPadding=0)
        self.addPageTemplates(PageTemplate(id='main',frames=frame,onPage=self.page_design))
        self.segment='Panduan bergambar'
        self.section_title=''
    def beforeDocument(self):
        self.segment='Panduan bergambar';self.section_title=''
    def page_design(self,c,doc):
        c.saveState()
        if doc.page==1:
            c.setFillColor(PALE);c.rect(0,0,W,H,fill=1,stroke=0)
            c.setFillColor(GREEN);c.rect(0,H-12,W,12,fill=1,stroke=0)
            c.setFillColor(GOLD);c.rect(45,36,56,3,fill=1,stroke=0)
        else:
            c.setFont('Segoe-Bold',8);c.setFillColor(GREEN)
            c.drawString(45,H-30,'AN-NAHL  /  PANDUAN PENGGUNA')
            c.setFont('Segoe',8);c.setFillColor(MUTED)
            c.drawRightString(W-45,H-30,'Edisi 30 Oktober 2026')
            c.setStrokeColor(LINE);c.line(45,H-39,W-45,H-39)
            c.line(45,34,W-45,34)
            c.setFont('Segoe',7.5)
            c.drawString(45,21,clean(self.segment))
            c.drawRightString(W-45,21,str(doc.page))
        c.restoreState()
    def afterFlowable(self,flowable):
        if getattr(flowable,'manual_heading',False):
            n=flowable.manual_number
            letter,title=group(n)
            self.segment=f'Segmen {letter} - {title}'
            self.section_title=flowable.getPlainText()
            key=f'bagian-{n}'
            self.canv.bookmarkPage(key)
            self.canv.addOutlineEntry(clean(self.section_title),key,0,False)
            self.notify('TOCEntry',(0,clean(self.section_title),self.page,key))

def md_blocks(lines):
    i=0
    while i<len(lines):
        line=lines[i]
        if not line.strip(): i+=1;continue
        if line.startswith('### '):
            yield ('heading',line[4:]);i+=1;continue
        if line.startswith('|'):
            rows=[]
            while i<len(lines) and lines[i].startswith('|'):
                if not re.match(r'^\|[\s:|\-]+\|$',lines[i]):
                    rows.append([x.strip() for x in lines[i].strip().strip('|').split('|')])
                i+=1
            yield ('table',rows);continue
        li=re.match(r'^(\d+\.|-) (.+)',line)
        if li:
            yield ('list',(li[1],li[2]));i+=1;continue
        paragraph=[]
        while i<len(lines) and lines[i].strip() and not re.match(r'^(### |\||\d+\. |- )',lines[i]):
            paragraph.append(lines[i].strip());i+=1
        yield ('paragraph',' '.join(paragraph))

def make_table(rows):
    columns=len(rows[0])
    widths=[CW*.3,CW*.7] if columns==2 else [CW*.16,CW*.22,CW*.62]
    if columns not in (2,3):widths=[CW/columns]*columns
    cells=[[p(cell,'tablehead' if r==0 else 'table') for cell in row] for r,row in enumerate(rows)]
    t=Table(cells,colWidths=widths,repeatRows=1,hAlign='LEFT')
    t.setStyle(TableStyle([
        ('VALIGN',(0,0),(-1,-1),'TOP'),('BACKGROUND',(0,0),(-1,0),PALE),
        ('LINEBELOW',(0,0),(-1,0),.6,LINE),('LINEBELOW',(0,1),(-1,-1),.3,LINE),
        ('ROWBACKGROUNDS',(0,1),(-1,-1),[colors.white,colors.HexColor('#fafcf8')]),
        ('LEFTPADDING',(0,0),(-1,-1),8),('RIGHTPADDING',(0,0),(-1,-1),8),
        ('TOPPADDING',(0,0),(-1,-1),7),('BOTTOMPADDING',(0,0),(-1,-1),7),
    ]))
    return [t,Spacer(1,12)]

story=[]
story.append(Image(str(ROOT/'public/brand/an-nahl.png'),width=134,height=72,kind='proportional',hAlign='LEFT'))
story.append(Spacer(1,25))
story.append(p('PANDUAN PENGGUNA • EDISI BERGAMBAR','label'))
story.append(p('Website<br/>An-Nahl','cover'))
story.append(Paragraph('Tutorial semua fitur, langkah demi langkah',ParagraphStyle('cover-sub',parent=styles['body'],fontSize=17,leading=24,textColor=GREEN,spaceAfter=16)))
story.append(p('Untuk pengunjung, calon wali santri, donatur,<br/>Penulis, dan Admin.'))
story.append(Spacer(1,12))
story.append(Screenshot('01-beranda',maxheight=240))
story.append(Spacer(1,17))
story.append(p('Pondok Pesantren Pemberdayaan Ummat An-Nahl','label'))
story.append(p('30 Oktober 2026 • Edisi 1.1<br/>27 bagian • Screenshot website lokal dan Ruang Pengurus demo','small'))
story.append(PageBreak())
story.append(p('Cara memakai panduan','h1'))
story+=note('Baca sesuai kebutuhan','Gunakan daftar isi atau bookmark PDF untuk langsung menuju fitur. Tiap bagian berisi tujuan, screenshot yang relevan, langkah penggunaan, dan penjelasan hasilnya.')
story.append(p('1. Temukan segmen Anda','h2'))
story+=make_table([['Segmen','Isi'],['A - Mulai dan navigasi','Bagian 1-3. Peta fitur dan hak akses.'],['B - Pengunjung','Bagian 4-8. Pendaftaran, berita, galeri, donasi, dan kontak.'],['C - Akun dan berita','Bagian 9-13. Login, editor, draft, penerbitan, arsip, dan riwayat.'],['D - Dokumentasi','Bagian 14-15. Foto, video YouTube, dan perpustakaan Drive.'],['E - Isi website','Bagian 16-18. Edit halaman, pratinjau, QRIS, dan pemulihan.'],['F - Pengelolaan','Bagian 19-23. Kiriman, rekap, akun, dan mode demo.'],['G - Bantuan','Bagian 24-27. Kebiasaan kerja, kendala, contoh alur, dan batas fitur.']])
story.append(p('2. Cocokkan penanda pada gambar','h2'))
story.append(p('Lingkaran hijau bernomor menandai tombol atau area penting. Baca keterangannya tepat di bawah screenshot. Sebagian gambar menampilkan potongan area agar isian lebih mudah dibaca. Semua gambar berasal dari tangkapan browser; browser dan tepi jendela dipotong pada tata letak PDF.'))
story.append(p('3. Kenali cakupan dokumentasi','h2'))
story.append(p('Screenshot diambil dari proyek lokal pada 30 Oktober 2026. Ruang Pengurus menggunakan akun demo dengan data latihan. Berita publik tidak dihubungkan ke database pada sesi dokumentasi; Google Sheets privat, data pendaftar, bukti donasi, dan data akun asli tidak dibuka.'))
story+=note('Contoh tampilan bukan acuan transaksi','Jadwal, biaya, kontak, nomor rekening, dan angka pada screenshot mengikuti isi bawaan lokal. Gunakan informasi resmi terbaru yang telah dikonfirmasi pondok untuk transaksi dan keputusan pendaftaran. Manual ini tidak menguji pembayaran atau pengiriman formulir produksi.')
story.append(p('Klik juga berarti ketuk pada ponsel. Tanda * berarti wajib. Screenshot menjelaskan posisi kontrol; tata letaknya dapat mengikuti ukuran layar. Teks PDF dapat dicari dengan Ctrl+F.','small'))
story.append(PageBreak())
story.append(p('Daftar isi','h1'))
story.append(p('Klik judul atau nomor halaman untuk membuka bagian. Bookmark tersedia pada aplikasi pembaca PDF.','small'))
toc=TableOfContents()
toc.levelStyles=[ParagraphStyle('toc',fontName='Segoe',fontSize=9.4,leading=13,textColor=INK,leftIndent=0,firstLineIndent=0,spaceBefore=4,rightIndent=25)]
toc.tableStyle.add('TOPPADDING',(0,0),(-1,-1),0)
toc.tableStyle.add('BOTTOMPADDING',(0,0),(-1,-1),1)
toc.dotsMinLevel=0
story.append(toc)

source=(ROOT/'USER_MANUAL.md').read_text(encoding='utf-8')
sections=re.split(r'^## (\d+)\. (.+)\n',source,flags=re.M)
for k in range(1,len(sections),3):
    n,title,body=int(sections[k]),sections[k+1].strip(),sections[k+2]
    story.append(PageBreak())
    letter,gtitle=group(n)
    story.append(p(f'SEGMEN {letter} / {gtitle.upper()}','label'))
    head=p(f'{n:02d}. {title}','h1');head.manual_heading=True;head.manual_number=n
    story.append(head)
    story+=note('Tujuan bagian ini',GOALS[n])
    story+=primary(n)
    if n==3:
        story+=figure('03-program','Program pendidikan dan pengantar Tahfidz pada halaman Program.',maxheight=245)
    if n==20 or n==21:
        story+=note('Tutorial untuk akun produksi','Menu rekap pada akun asli menyediakan tautan Edit / hapus rekap di Google Sheets. Rekap donasi juga menyediakan Unduh laporan rekap (.xlsx). Tampilan demo yang dipakai untuk screenshot tidak menampilkan tombol Google tersebut. Langkah berikut mengikuti fitur akun asli pada kode proyek.')
    for kind,value in md_blocks(body.splitlines()):
        if kind=='heading':
            extra=supplemental(n,value)
            if extra:
                # Flatten existing figure groups before joining to a heading.
                # Nested KeepTogether objects report an intentionally enormous
                # wrap height and can create unnecessary page breaks.
                flat=[]
                for item in extra:
                    flat.extend(item._content if isinstance(item,KeepTogether) else [item])
                if n==6 and value=='Video':
                    story.append(KeepTogether([p('Memperbesar foto','h2'),*flat]))
                    story.append(p(value,'h2'))
                else:
                    story.append(KeepTogether([p(value,'h2'),*flat]))
            else:
                story.append(p(value,'h2'))
        elif kind=='table':story+=make_table(value)
        elif kind=='list':
            marker,text=value
            story.append(Paragraph(inline(text),styles['step'],bulletText='•' if marker=='-' else marker))
        else:
            if n==27 and value.startswith('**Memakai dokumen ini:**'):continue
            story.append(p(value))
            if n==16 and value=='Langkah penggunaan:':
                story+=figure('25-cms-bagian','Halaman Beranda pada pengelolaan isi website.',
                              '1 Pratinjau, Simpan draft, dan Terbitkan perubahan. 2 Edit bagian. 3 Hapus bagian pada kartu yang mendukungnya.',
                              crop=(380,270,1765,1010),markers=[(1,1604,448),(2,560,917),(3,1343,938)],maxheight=290)
                story+=figure('26-cms-editor','Editor bagian: judul, teks, dan tujuan tautan.',
                              'Selesai mengedit menerapkan isian pada pekerjaan editor. Tetap simpan draft atau terbitkan dari halaman pengelolaan.',
                              crop=(592,129,1313,980),markers=[(1,1295,345),(2,1295,571),(3,1117,939)],maxheight=370)
    if n==16:
        story.append(p('Tutorial pratinjau sebelum menerbitkan','h2'))
        number=len(FIGURES)+1
        FIGURES.append({'number':number,'file':'27-cms-preview-desktop','caption':'Pratinjau Desktop dan Ponsel.'})
        left=Screenshot('27-cms-preview-desktop',(373,164,1533,945),maxheight=225,maxwidth=CW*.58)
        right=Screenshot('28-cms-preview-ponsel',(750,276,1150,944),maxheight=225,maxwidth=CW*.36)
        pair=Table([[left,right]],colWidths=[CW*.61,CW*.39],hAlign='LEFT')
        pair.setStyle(TableStyle([('VALIGN',(0,0),(-1,-1),'TOP'),('LEFTPADDING',(0,0),(-1,-1),0),('RIGHTPADDING',(0,0),(-1,-1),0)]))
        story.append(KeepTogether([pair,Spacer(1,7),Paragraph(f'<b>Gambar {number:02d}.</b> Pratinjau Desktop (kiri) dan Ponsel (kanan).<br/>Periksa susunan, judul, teks, foto, dan tombol. Pratinjau tidak mengirim formulir. Setelah meninjau, tutup pratinjau dan terbitkan bila sudah siap.',styles['caption'])]))
    if n==27:
        story.append(p('Memperbarui PDF ini','h2'))
        story.append(p('Sumber tulisan berada pada USER_MANUAL.md. Gambar asli tersimpan pada folder output/pdf/screenshots. Pengelola dapat memperbarui tulisan dan screenshot yang berubah, kemudian menjalankan scripts/build-user-manual-pdf.py untuk membangun PDF kembali.'))

doc=ManualDoc(PDF)
doc.multiBuild(story)
(OUT/'manual-figures.json').write_text(json.dumps(FIGURES,ensure_ascii=False,indent=2),encoding='utf-8')
print(json.dumps({'pdf':str(PDF),'figures':len(FIGURES),'screenshots':len(list(SHOTS.glob('*.png'))),'bytes':PDF.stat().st_size},ensure_ascii=False))
