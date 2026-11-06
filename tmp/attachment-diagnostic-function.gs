// Temporary, explicitly approved test: one synthetic PNG, no Sheet write.
function checkGoogleFormAttachment() {
  const config = formsConfig_();
  const bytes = Utilities.base64Decode('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jMZkAAAAASUVORK5CYII=');
  const record = {
    id: '9f4f6a90-6fa3-4a24-a276-53a695373f5a', kind: 'pendaftaran', version: 1, issuedAt: Math.floor(Date.now()/1000),
    payload: {nama:'UJI LAMPIRAN - ABAIKAN',tempatLahir:'DATA UJI',tanggalLahir:'2014-01-01',jenisKelamin:'Laki-laki',asalSekolah:'SEKOLAH UJI',jenjang:'SD',namaWali:'WALI UJI',noWA:'000000000000',email:'',alamat:'DATA UJI'},
    files: [{name:'uji-lampiran-abaikan.png',mime:'image/png',bytes:bytes.length,sha256:formsDigest_(bytes),data:Utilities.base64Encode(bytes)}]
  };
  const hash = formsValidate_(record);
  formsUpload_(formsFolder_(config),record,hash);
  console.info('Uji lampiran PNG berhasil. Tidak ada baris pendaftar yang ditambahkan.');
}

function checkGoogleAttachmentMetadata() {
  // Read-only: only ScriptProperties.getProperty and Drive.Files.list are called.
  const root = PropertiesService.getScriptProperties().getProperty('ANNAHL_UPLOADS_FOLDER_ID');
  const folders = Drive.Files.list({q:"'"+root+"' in parents and trashed = false and mimeType = 'application/vnd.google-apps.folder'",orderBy:'createdTime desc',pageSize:8,fields:'files(id,appProperties)'}).files || [];
  const results = folders.filter(function(folder) { return folder.appProperties && folder.appProperties.requestId; }).map(function(folder) {
    const files = Drive.Files.list({q:"'"+folder.id+"' in parents and trashed = false",pageSize:4,fields:'files(id,mimeType,size,appProperties),nextPageToken'});
    return {synthetic:folder.appProperties.requestId==='9f4f6a90-6fa3-4a24-a276-53a695373f5a',hasMoreFiles:!!files.nextPageToken,files:(files.files || []).map(function(file) { return {mime:file.mimeType,bytes:Number(file.size || 0),hasDigest:!!(file.appProperties && file.appProperties.sha256)}; })};
  });
  console.info(JSON.stringify(results));
}

function checkGoogleLargeAttachmentValidation() {
  const record = {
    id:'9f4f6a90-6fa3-4a24-a276-53a695373f5a',kind:'pendaftaran',version:1,issuedAt:Math.floor(Date.now()/1000),
    payload:{nama:'UJI VALIDASI',tempatLahir:'DATA UJI',tanggalLahir:'2014-01-01',jenisKelamin:'Laki-laki',asalSekolah:'SEKOLAH UJI',jenjang:'SD',namaWali:'WALI UJI',noWA:'000000000000',email:'',alamat:'DATA UJI'},
    files:[{name:'uji-validasi.png',mime:'image/png',bytes:6291456,sha256:'b69dae56a14d1a8314ed40664c4033ea0a550eea2673e04df42a66ac6b9faf2c',data:'AAAA'.repeat(2097152)}]
  };
  formsValidate_(record);
  console.info('Validasi Base64 dan hash 6 MiB berhasil. Tidak ada unggahan atau baris pendaftar yang dibuat.');
}
