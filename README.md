# Shine

[Open Shine](https://tenzin3.github.io/shine/web/)

*Tibetan wisdom for everyday life.*

Shine is a free, static website with 29 teachings from Lotsawa House, grouped
into nine collections. It runs on GitHub Pages without a server application,
account, or API key.

## Features

- Browse collections, search the full texts, or open today's teaching.
- Describe what's on your mind to receive up to three lesson suggestions, with
  summaries and matched words. Crisis-related messages show the existing help
  resources instead of recommendations.
- Read the original lesson text, follow its source, and copy its citation.
- Listen to saved AI narration, pause and resume, seek through a recording, or
  jump between spoken paragraphs while the reader highlights the current one.
- Add gentle ambient music, control its volume, and save your music preferences.
- Save favourite lessons and revisit recently opened teachings.
- Use the responsive phone layout, including swipeable navigation at the bottom.

## Run locally

The built site and all photographs and recordings are committed to the repository.
To preview it, run this from the project folder:

```sh
python3 -m http.server 8000
```

Open [localhost:8000/web/](http://localhost:8000/web/).

Reading and saved media work offline when the files are available locally.
The site also uses Google Fonts and the free Datamuse service; fonts fall back
to installed fonts, and recommendations still use local keywords if Datamuse
is unavailable. Favourite lessons, recent history, and music settings are saved
in the browser's local storage.

## Project structure

| Path | Purpose |
| --- | --- |
| `src/template.html` | Page markup and build placeholders |
| `src/styles.css` | Desktop, phone, and landscape layouts |
| `src/js/` | Application code, split into matching, catalog, views, discovery, reader, player, music, and startup files |
| `tools/lessons.py` | Shared source loading, paragraph cleaning, stable lesson IDs, and text fingerprints |
| `tools/build_web.py` | Validates content and produces both HTML versions |
| `tools/lesson_summaries.json` | Recommendation summaries and lesson keywords |
| `tools/match_words.json` | Collection keywords |
| `tools/lesson_photos.json` | Curated photograph source pages and themes |
| `data/lotsawa/` | Original source download, manifest, individual text copies, and attribution records |
| `web/` | Generated pages and the media needed for publication |
| `tests/` | Content, build, navigation, matching, and playback regression checks |
| `docs/source-research.md` | Historical source research from the initial prototype |

Edit the source files and rebuild; changes made directly to the generated HTML
will be overwritten. The build combines the JavaScript files in an explicit
order and inlines both code and styles, so no npm installation or bundler is
needed. The source JavaScript files share one script scope.

## Build and check

Use Python 3.10 or newer. The normal build uses only Python's standard library.

```sh
python3 tools/build_web.py
python3 tools/build_web.py --check
python3 -m unittest discover -s tests
```

If Node.js 18 or newer is available, also run the application checks:

```sh
node --test tests/app.test.cjs
```

The build validates lesson summaries, recording fingerprints, and paragraph
mappings. `--check` verifies that both generated pages match their source without
rewriting them. The JavaScript checks cover navigation, search, saved lessons,
the reader, playback, music settings, and offline recommendations using a
simulated browser environment; they do not replace testing on an actual phone.

Two pages are generated:

- `web/index.html` references the photographs and audio in adjacent folders.
- `web/shine_artifact.html` embeds the photographs. It still needs the `audio/`
  folder beside it for narration; it is not a fully self-contained audio export.

## Update lessons and recommendations

The source download is `data/lotsawa/raw/lotsawa_texts_2026-11-02.json`.
Keep its existing order: IDs such as `LH001` are assigned by position and are
used by saved favourites, images, recordings, and recommendation metadata.
Append new lessons rather than reordering existing ones.

When adding or changing a lesson:

1. Update the source data and its attribution records.
2. Add or update its exact title, summary, and keywords in
   `tools/lesson_summaries.json`; collection keywords live in `tools/match_words.json`.
3. Add a corresponding photograph and its source credit.
4. Generate or regenerate its narration if its paragraphs changed.
5. Rebuild and run the checks above.

Recommendations combine local keywords with related words from
[Datamuse](https://www.datamuse.com/api/). Up to eight individual words are looked
up for a request; the full message is not sent to Datamuse or stored in local
storage. It remains in page memory while the site is open. Related-word lookups
are cached in page memory and fall back to local matching on failure.

## Maintain media

All existing media can be used without generating or downloading it again.

### Photographs

The 29 curated Pexels photographs are stored in `web/images/`. Source pages,
descriptions, and license links are recorded in `web/images/credits.json`.
To restore missing photographs on macOS, with `curl` and `sips` available:

```sh
python3 tools/download_lesson_photos.py
python3 tools/build_web.py
```

Existing image files are preserved. Update `tools/lesson_photos.json` when
changing the curated selection.

### Narration

Recordings use Sonia's neural voice at a slightly slower pace. They read the
English translation; Tibetan text, phonetic lines, and reference notes remain
available in the reader. Recordings are labelled as AI narration.

Only audio generation needs extra dependencies: FFmpeg and FFprobe on your
command path, plus the optional Python requirements:

```sh
python3 -m venv .venv
source .venv/bin/activate
python -m pip install -r requirements-narration.txt
python tools/generate_narration.py --only LH001
python tools/build_web.py
```

Omit `--only LH001` to process all lessons. `--concurrency 4` limits simultaneous
requests. Generation sends the public lesson text to Microsoft's online speech
service through [edge-tts](https://github.com/rany2/edge-tts); it requires internet
access. The shipped website plays the saved MP3s without contacting that service.

Matching recordings are reused. Temporary audio segments are cached in the
operating system's temporary folder. Each lesson has a metadata sidecar in
`web/audio/`, and `manifest.json` collects the durations, paragraph timestamps,
voice settings, and text fingerprints used by the player. Keep the MP3s, sidecars,
and manifest together. The generator reads the original lesson data directly,
so it can regenerate changed text before the next build.

If the build reports outdated narration, regenerate the affected lesson and
rebuild. If a recording cannot load, confirm that the complete `web/audio/`
folder was copied or published with the HTML.

## Publish with GitHub Pages

For this repository, select **Settings → Pages → Deploy from a branch → main →
/ (root)**, then save. Commit and push the rebuilt pages and media. The site is
served at [tenzin3.github.io/shine/web/](https://tenzin3.github.io/shine/web/).

Keep the complete `web/` folder together, including `images/` and `audio/`.
Publishing the HTML alone will break its media references. Source edits are not
live until the rebuilt output has been pushed and GitHub Pages has deployed it.

## Sources and permitted use

The teachings are Buddhist practice and reflection, not medical or mental-health
care. They retain the source and translator attribution supplied by Lotsawa House.
The current collection uses **CC BY-NC 4.0** material: retain attribution and keep
its use non-commercial. Do not add restricted practices. Before commercial use,
obtain the relevant permissions or replace the content.

See [the source and attribution records](data/lotsawa/SOURCES.md),
[the lesson manifest](data/lotsawa/manifest.csv), and
[the original research notes](docs/source-research.md) for provenance and context.
Photograph licenses and credits are recorded separately with the images.
