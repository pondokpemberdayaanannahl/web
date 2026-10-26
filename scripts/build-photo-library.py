"""Build browser-compatible previews for every local photo; never change originals."""
from pathlib import Path
import hashlib
import json
import re
import sys

ROOT = Path(__file__).resolve().parents[1]
decoder = ROOT / '.photo-tools'
if decoder.exists():
    sys.path.insert(0, str(decoder))
from PIL import Image, ImageOps
import pillow_heif
pillow_heif.register_heif_opener()

SOURCE = ROOT / 'picture'
OUTPUT = ROOT / 'public' / 'media'
OUTPUT.mkdir(parents=True, exist_ok=True)
manifest_path = ROOT / 'src' / 'data' / 'photo-manifest.json'
existing = json.loads(manifest_path.read_text(encoding='utf-8-sig'))
extensions = {'.jpg', '.jpeg', '.png', '.webp', '.heic', '.heif', '.gif'}
rows = []
source_bytes = 0


def folder_label(relative):
    labels = []
    for part in relative.parent.parts:
        cleaned = re.sub(r'-\d{8}T\d{6}Z.*$', '', part).strip().replace('_', ' ')
        if not labels or labels[-1].casefold() != cleaned.casefold():
            labels.append(cleaned)
    return ' / '.join(labels) or 'Foto lainnya'


for path in sorted(SOURCE.rglob('*')):
    if not path.is_file() or path.suffix.lower() not in extensions:
        continue
    relative = path.relative_to(SOURCE)
    relative_string = relative.as_posix()
    source_bytes += path.stat().st_size
    digest = hashlib.sha256(path.read_bytes()).hexdigest()[:16]
    variants = existing.get(relative_string)
    if not variants or not variants['full'].startswith(f'/media/{digest}-') or not all((ROOT / 'public' / variants[key].lstrip('/')).is_file() for key in ('full', 'thumbnail')):
        variants = {'full': f'/media/{digest}-1600.jpg', 'thumbnail': f'/media/{digest}-480.jpg'}
        with Image.open(path) as original:
            image = ImageOps.exif_transpose(original)
            if image.mode in ('RGBA', 'LA') or 'transparency' in image.info:
                rgba = image.convert('RGBA')
                rgb = Image.new('RGB', rgba.size, 'white')
                rgb.paste(rgba, mask=rgba.getchannel('A'))
                image = rgb
            else:
                image = image.convert('RGB')
            for key, edge in (('full', 1600), ('thumbnail', 480)):
                resized = image.copy()
                resized.thumbnail((edge, edge), Image.Resampling.LANCZOS)
                resized.save(ROOT / 'public' / variants[key].lstrip('/'), 'JPEG', quality=80, optimize=True)
    if relative_string in existing:
        existing[relative_string] = variants
    rows.append({
        'id': hashlib.sha256(relative_string.encode()).hexdigest()[:16],
        'filename': path.name,
        'path': relative_string,
        'folder': folder_label(relative),
        'format': path.suffix[1:].upper(),
        'bytes': path.stat().st_size,
        'full': variants['full'],
        'thumbnail': variants['thumbnail'],
    })

target = ROOT / 'src' / 'data' / 'photo-library.json'
target.write_text(json.dumps({'photos': rows}, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
manifest_path.write_text(json.dumps(existing, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
print(f'Library ready: {len(rows)} photos, {sum(row["format"] in ("HEIC", "HEIF") for row in rows)} HEIC/HEIF. Originals unchanged.', flush=True)
