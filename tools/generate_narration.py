"""Generate saved neural narration and paragraph timings for every lesson.

Install edge-tts==7.3.1 and ffmpeg, then run this script. Matching recordings
and intermediate segments are reused. Public lesson text is sent to
Microsoft's online TTS service. No API credentials are stored in the site.
"""
import argparse
import asyncio
import bisect
import hashlib
import html
import json
from pathlib import Path
import re
import subprocess
import tempfile
import unicodedata

import edge_tts

from lessons import WEB_DIR, load_lessons, paragraph_digest

OUT = WEB_DIR / 'audio'
CACHE = Path(tempfile.gettempdir()) / 'shine-narration-segments'
VOICE = 'en-GB-SoniaNeural'
RATE = '-8%'


def normalize(text):
    return ''.join(c for c in unicodedata.normalize('NFKC', html.unescape(text)).casefold() if c.isalnum())


def duration(path):
    return float(subprocess.check_output(['ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'default=noprint_wrappers=1:nokey=1', str(path)], text=True))


def english_paragraphs(paras):
    """Keep the English translation; leave Tibetan and references in the reader."""
    indices = []
    after_tibetan = False
    for i, paragraph in enumerate(paras):
        if paragraph in ('Source', 'Notes', 'Bibliography', 'Tibetan Edition'):
            break
        if re.search(r'[\u0f00-\u0fff]', paragraph):
            after_tibetan = True
            continue
        if after_tibetan and paragraph[:1].islower() and len(paragraph.split()) < 25:
            after_tibetan = False
            continue
        after_tibetan = False
        indices.append(i)
    return indices


async def segment(paras, semaphore):
    signature = hashlib.sha256((paragraph_digest(paras) + VOICE + RATE).encode()).hexdigest()
    mp3, sidecar = CACHE / f'{signature}.mp3', CACHE / f'{signature}.json'
    if mp3.exists() and sidecar.exists():
        return mp3, json.loads(sidecar.read_text())
    async with semaphore:
        normalized = [normalize(p) for p in paras]
        starts, full, length = [], ''.join(normalized), 0
        for p in normalized:
            starts.append(length)
            length += len(p)
        temporary = mp3.with_suffix('.partial.mp3')
        for attempt in range(4):
            try:
                cursor, times, last_end = 0, [None] * len(starts), 0
                narration = edge_tts.Communicate('\n\n'.join(paras), VOICE, rate=RATE, boundary='WordBoundary')
                with temporary.open('wb') as output:
                    async for chunk in narration.stream():
                        if chunk['type'] == 'audio':
                            output.write(chunk['data'])
                        elif chunk['type'] == 'WordBoundary':
                            word = normalize(chunk['text'])
                            if not word:
                                continue
                            position = full.find(word, cursor)
                            if position < 0:
                                raise ValueError(f'Cannot align spoken word at character {cursor}: {chunk["text"]!r}')
                            paragraph = bisect.bisect_right(starts, position) - 1
                            offset = chunk['offset'] / 10_000_000
                            if times[paragraph] is None:
                                times[paragraph] = round(offset, 3)
                            cursor = position + len(word)
                            last_end = (chunk['offset'] + chunk['duration']) / 10_000_000
                if cursor != len(full) or temporary.stat().st_size < 1000:
                    raise ValueError(f'Incomplete recording: {cursor}/{len(full)} characters')
                seconds = duration(temporary)
                if seconds < last_end - 1:
                    raise ValueError('Recording is shorter than the final spoken word')
                for i in range(len(times) - 1, -1, -1):
                    if times[i] is None:
                        times[i] = times[i+1] if i+1 < len(times) else round(seconds, 3)
                times[0] = 0
                metadata = dict(duration=seconds, paragraphs=times)
                temporary.replace(mp3)
                sidecar.write_text(json.dumps(metadata))
                return mp3, metadata
            except Exception as error:
                print(f'Segment retry {attempt+1}: {error}', flush=True)
                temporary.unlink(missing_ok=True)
                if attempt == 3:
                    raise
                await asyncio.sleep(3 * (attempt+1))


async def generate(lesson, semaphore):
    identifier = lesson['id']
    mp3, sidecar = OUT / f'{identifier}.mp3', OUT / f'{identifier}.json'
    signature = paragraph_digest(lesson['paras'])
    indices = english_paragraphs(lesson['paras'])
    if mp3.exists() and sidecar.exists():
        old = json.loads(sidecar.read_text())
        if old['text_sha256'] == signature and old['voice'] == VOICE and old['rate'] == RATE and old.get('paragraph_indices', list(range(len(lesson['paras'])))) == indices:
            print(identifier, 'already recorded', flush=True)
            return identifier, old
    # Keep paragraphs intact. Render bounded segments concurrently, then join
    # without re-encoding, retaining the voice's natural phrasing within each.
    groups, group, size = [], [], 0
    for paragraph in (lesson['paras'][i] for i in indices):
        if group and size + len(paragraph) > 1800:
            groups.append(group)
            group, size = [], 0
        group.append(paragraph)
        size += len(paragraph) + 2
    if group:
        groups.append(group)
    parts = await asyncio.gather(*(segment(p, semaphore) for p in groups))
    times, elapsed = [], 0
    for _, metadata in parts:
        times.extend(round(t + elapsed, 3) for t in metadata['paragraphs'])
        elapsed += metadata['duration']
    playlist = CACHE / f'{identifier}-concat.txt'
    playlist.write_text(''.join(f"file '{path}'\n" for path, _ in parts))
    temporary = mp3.with_suffix('.partial.mp3')
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-f', 'concat', '-safe', '0', '-i', str(playlist), '-c', 'copy', str(temporary)], check=True)
    seconds = duration(temporary)
    metadata = dict(src=f'audio/{identifier}.mp3', voice=VOICE, rate=RATE,
                    narrator='Sonia · AI narration', duration=round(seconds, 3),
                    paragraphs=times, text_sha256=signature,
                    paragraph_indices=indices,
                    note='AI-generated narration of the credited Lotsawa House translation')
    temporary.replace(mp3)
    sidecar.write_text(json.dumps(metadata, indent=2) + '\n')
    print(identifier, f'recorded {seconds/60:.1f} min', flush=True)
    return identifier, metadata


async def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--only', nargs='+')
    parser.add_argument('--concurrency', type=int, default=12)
    args = parser.parse_args()
    OUT.mkdir(parents=True, exist_ok=True)
    CACHE.mkdir(parents=True, exist_ok=True)
    lessons = load_lessons()
    if args.only:
        lessons = [t for t in lessons if t['id'] in args.only]
    semaphore = asyncio.Semaphore(max(1, args.concurrency))
    manifest_path = OUT / 'manifest.json'
    manifest = json.loads(manifest_path.read_text()) if manifest_path.exists() else {}
    tasks = [asyncio.create_task(generate(t, semaphore)) for t in lessons]
    failures = []
    for task in asyncio.as_completed(tasks):
        try:
            identifier, recording = await task
            manifest[identifier] = recording
            manifest_path.write_text(json.dumps(manifest, indent=2) + '\n')
        except Exception as error:
            failures.append(str(error))
    if failures:
        raise SystemExit('\n'.join(failures))
    print(f'{len(manifest)} recordings ready', flush=True)


if __name__ == '__main__':
    asyncio.run(main())
