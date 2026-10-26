import fs from 'node:fs';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
const virtualPython = fileURLToPath(new URL('../.photo-tools-venv/Scripts/python.exe', import.meta.url));
const python = process.env.PHOTO_PYTHON || (fs.existsSync(virtualPython) ? virtualPython : 'python');
const result = spawnSync(python, [fileURLToPath(new URL('./build-photo-library.py', import.meta.url))], { stdio: 'inherit', windowsHide: true });
if (result.error) console.error('Python belum tersedia. Baca persiapan katalog foto pada BACKEND_SETUP.md.');
process.exitCode = result.status ?? 1;
