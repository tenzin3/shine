"""Download the curated lesson photographs and retain their source credits."""
import concurrent.futures
import json
from pathlib import Path
import re
import subprocess

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'web' / 'images'

def download(photo):
    number = re.search(r'-(\d+)/$', photo['page']).group(1)
    url = f'https://images.pexels.com/photos/{number}/pexels-photo-{number}.jpeg?auto=compress&cs=tinysrgb&w=720&h=720&fit=crop'
    dst = OUT / (photo['id'] + '.jpg')
    if not dst.exists():
        temporary = dst.with_suffix('.download')
        subprocess.run(['curl', '-sS', '-L', '--fail', '--retry', '2', '--max-time', '60', url, '-o', str(temporary)], check=True)
        subprocess.run(['sips', '-g', 'pixelWidth', str(temporary)], check=True, capture_output=True)
        temporary.replace(dst)
    return photo['id'], dict(source=photo['page'], download=url, description=photo['theme'], license='https://www.pexels.com/license/', note='Pexels photograph; square crop for lesson artwork')

if __name__ == '__main__':
    OUT.mkdir(parents=True, exist_ok=True)
    photos = json.loads((ROOT / 'tools' / 'lesson_photos.json').read_text())
    with concurrent.futures.ThreadPoolExecutor(max_workers=6) as pool:
        credits = dict(pool.map(download, photos))
    (OUT / 'credits.json').write_text(json.dumps(credits, indent=2) + '\n')
    print(f'{len(credits)} lesson photos downloaded and credited')
