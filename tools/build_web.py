"""Build the two static HTML versions. No third-party packages are required."""

import argparse
import base64
import json
import math

from lessons import ROOT, WEB_DIR, load_json, load_lessons, paragraph_digest

SOURCE_DIR = ROOT / 'src'
SCRIPT_FILES = (
    'data.js', 'matching.js', 'catalog.js', 'views.js', 'discovery.js',
    'reader.js', 'player.js', 'music.js', 'app.js',
)
CRISIS_PATTERNS = [
    'suicid', 'kill(ing)? myself', 'end(ing)? (it all|my life)',
    'want(ed)? to die', 'wish i (was|were) dead', 'better off dead',
    'self[- ]?harm', 'hurt(ing)? myself', 'cut(ting)? myself',
    "(do not|don't|dont) want to (live|be alive)", 'no reason to live',
    'take my (own )?life', 'overdose',
]


def lesson_images(lessons):
    local, embedded = {}, {}
    for lesson in lessons:
        relative = f"images/{lesson['id']}.jpg"
        image = WEB_DIR / relative
        if image.exists():
            local[lesson['id']] = relative
            embedded[lesson['id']] = 'data:image/jpeg;base64,' + base64.b64encode(image.read_bytes()).decode()
    return local, embedded


def validate_recording(lesson, recording):
    identifier = lesson['id']
    if recording['text_sha256'] != paragraph_digest(lesson['paras']) or not (WEB_DIR / recording['src']).is_file():
        raise ValueError(f'Missing or outdated narration: {identifier}. Run tools/generate_narration.py first.')
    times = recording['paragraphs']
    indices = recording.get('paragraph_indices', list(range(len(lesson['paras']))))
    if (
        not indices or len(times) != len(indices)
        or indices != sorted(set(indices))
        or indices[0] < 0 or indices[-1] >= len(lesson['paras'])
        or times != sorted(times) or times[0] != 0
        or times[-1] > recording['duration']
    ):
        raise ValueError(f'Invalid paragraph timestamps: {identifier}')


def lesson_recordings(lessons):
    manifest = WEB_DIR / 'audio/manifest.json'
    recordings = load_json(manifest) if manifest.exists() else {}
    for lesson in lessons:
        recording = recordings.get(lesson['id'])
        if recording:
            validate_recording(lesson, recording)
            lesson['minutes'] = max(1, math.ceil(recording['duration'] / 60))
    return recordings


def matching_data(lessons):
    summaries = load_json(ROOT / 'tools/lesson_summaries.json')
    collections = load_json(ROOT / 'tools/match_words.json')['collections']
    info = {}
    for lesson in lessons:
        summary = summaries.get(lesson['id'])
        if not summary or summary['title'] != lesson['title']:
            raise ValueError(f"Update tools/lesson_summaries.json for {lesson['id']} ({lesson['title']})")
        info[lesson['id']] = {'summary': summary['summary'], 'keywords': summary.get('keywords', [])}
    return {'lessons': info, 'collections': collections}


def render_pages():
    lessons = load_lessons()
    local_images, embedded_images = lesson_images(lessons)
    recordings = lesson_recordings(lessons)
    template = (SOURCE_DIR / 'template.html').read_text(encoding='utf-8')
    styles = (SOURCE_DIR / 'styles.css').read_text(encoding='utf-8')
    scripts = '\n'.join((SOURCE_DIR / 'js' / name).read_text(encoding='utf-8') for name in SCRIPT_FILES)
    page = template.replace('/*__STYLES__*/', styles.rstrip()).replace('/*__SCRIPTS__*/', scripts.rstrip())
    for placeholder, data in (
        ('/*__DATA__*/[]', lessons), ('/*__AUDIO__*/{}', recordings),
        ('/*__MATCH_DATA__*/{}', matching_data(lessons)), ('/*__CRISIS__*/[]', CRISIS_PATTERNS),
    ):
        page = page.replace(placeholder, json.dumps(data, ensure_ascii=placeholder == '/*__AUDIO__*/{}'))
    local = page.replace('/*__IMG__*/{}', json.dumps(local_images))
    embedded = page.replace('/*__IMG__*/{}', json.dumps(embedded_images))
    document = (
        '<!doctype html>\n<html lang="en"><head><meta charset="utf-8">'
        '<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">'
        '</head><body>\n' + local + '\n</body></html>\n'
    )
    return {'index.html': document, 'shine_artifact.html': embedded}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--check', action='store_true', help='Verify generated HTML is current without writing files')
    args = parser.parse_args()
    pages = render_pages()
    if args.check:
        stale = [name for name, content in pages.items() if not (WEB_DIR / name).exists() or (WEB_DIR / name).read_text(encoding='utf-8') != content]
        if stale:
            raise SystemExit('Rebuild stale pages with python3 tools/build_web.py: ' + ', '.join(stale))
        print('Both generated pages are current.')
        return
    WEB_DIR.mkdir(exist_ok=True)
    for name, content in pages.items():
        (WEB_DIR / name).write_text(content, encoding='utf-8')
    print('Built web/index.html and web/shine_artifact.html')


if __name__ == '__main__':
    main()
