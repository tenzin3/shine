"""Build and content regressions. Run with python3 -m unittest discover -s tests."""

from copy import deepcopy
import importlib
from pathlib import Path
import sys
import unittest

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / 'tools'))
from lessons import WEB_DIR, load_json, load_lessons, paragraph_digest
from build_web import render_pages, validate_recording


class BuildTests(unittest.TestCase):
    def test_import_does_not_write_generated_pages(self):
        before = (WEB_DIR / 'index.html').stat().st_mtime_ns
        importlib.reload(sys.modules['build_web'])
        self.assertEqual(before, (WEB_DIR / 'index.html').stat().st_mtime_ns)

    def test_content_and_recordings_remain_in_sync(self):
        lessons = load_lessons()
        recordings = load_json(WEB_DIR / 'audio/manifest.json')
        self.assertEqual([lesson['id'] for lesson in lessons], [f'LH{i:03d}' for i in range(1, 30)])
        self.assertEqual(set(recordings), {lesson['id'] for lesson in lessons})
        for lesson in lessons:
            with self.subTest(lesson=lesson['id']):
                recording = recordings[lesson['id']]
                validate_recording(lesson, recording)
                self.assertTrue((WEB_DIR / f"images/{lesson['id']}.jpg").is_file())
                self.assertEqual(paragraph_digest(lesson['paras']), recording['text_sha256'])
                self.assertEqual(load_json(WEB_DIR / f"audio/{lesson['id']}.json"), recording)

    def test_stale_recording_is_rejected(self):
        lesson = load_lessons()[0]
        recording = deepcopy(load_json(WEB_DIR / 'audio/manifest.json')[lesson['id']])
        lesson['paras'].append('Changed translation.')
        with self.assertRaisesRegex(ValueError, 'outdated narration'):
            validate_recording(lesson, recording)

    def test_invalid_paragraph_mapping_is_rejected(self):
        lesson = load_lessons()[0]
        recording = deepcopy(load_json(WEB_DIR / 'audio/manifest.json')[lesson['id']])
        recording['paragraph_indices'] = [-1]
        with self.assertRaisesRegex(ValueError, 'Invalid paragraph'):
            validate_recording(lesson, recording)

    def test_generated_pages_are_current(self):
        for name, expected in render_pages().items():
            with self.subTest(page=name):
                self.assertEqual((WEB_DIR / name).read_text(encoding='utf-8'), expected)
                self.assertNotIn('/*__', expected)


if __name__ == '__main__':
    unittest.main()
