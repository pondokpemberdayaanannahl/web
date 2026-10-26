import { defineConfig } from 'vite';
import { fileURLToPath } from 'node:url';
import { readFileSync } from 'node:fs';
import { photos, galleryImages } from './src/data/photos.js';

const collectPhotos = value => typeof value === 'string' ? [value] : Object.values(value).flatMap(collectPhotos);

export default defineConfig({
  server: {
    fs: { deny:['.env','.env.*','*.{crt,pem}','**/.git/**','**/annahl-private/**','**/.backend-backups/**'] },
    proxy: { '/api/forms.php': { target:'http://127.0.0.1:5174',changeOrigin:false } },
  },
  preview: { proxy: { '/api/forms.php': { target:'http://127.0.0.1:5174',changeOrigin:false } } },
  plugins: [{
    name: 'referenced-pesantren-photos',
    apply: 'build',
    buildStart() {
      const paths = new Set([...collectPhotos(photos), ...galleryImages.map(image => image.src)]);
      for (const path of paths) {
        if (!path.startsWith('/picture/')) continue;
        const fileName = decodeURIComponent(path.slice(1));
        this.emitFile({ type: 'asset', fileName, source: readFileSync(fileURLToPath(new URL(`./${path.slice(1)}`, import.meta.url))) });
      }
    },
  }],
  build: {
    rolldownOptions: {
      input: {
        main: fileURLToPath(new URL('./index.html', import.meta.url)),
        admin: fileURLToPath(new URL('./admin.html', import.meta.url)),
      },
    },
  },
});
