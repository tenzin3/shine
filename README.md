# Shine — Source Data Overview

[Open Shine](https://tenzin3.github.io/shine/web/)

*Tibetan wisdom for everyday life.*

## Lesson artwork

All 29 lessons have individual, locally stored photographs in `web/images/`,
selected to reflect each teaching with the peaceful nature photography of Calm
as a visual reference. Source pages, descriptions, and license links are saved
in `web/images/credits.json`. The curated selection is in
`tools/lesson_photos.json`.

To restore missing photographs, run `python3 tools/download_lesson_photos.py`
(requires internet access), then `python3 tools/build_web.py`. The build uses
local images in `web/index.html` and embeds them in `web/shine_artifact.html`
for a portable, offline copy.

## Recorded narration

Lessons play saved MP3 recordings from `web/audio/` using Sonia's neural voice,
with a slightly slower reading pace. These are AI-generated readings of the
credited translations. The player uses real audio timestamps for seeking,
pause/resume, and paragraph highlighting, alongside the optional ambient music.
It does not use browser speech synthesis.

To regenerate recordings, install `edge-tts==7.3.1` in a Python virtual
environment and install FFmpeg, then run `python tools/generate_narration.py`
followed by `python tools/build_web.py`. Generation uses Microsoft's online
text-to-speech service through [edge-tts](https://github.com/rany2/edge-tts).
Completed recordings are reused; no credentials are needed by the website.
`web/audio/manifest.json` records the voice, text checksums, durations, and
paragraph timestamps.

Publish the entire `web/` folder, including `audio/`, to GitHub Pages. Both HTML
versions reference these local audio files; keep `audio/` alongside the HTML
when copying the site for offline use.

Before downloading anything, this file maps out what is available in our main
source, **Lotsawa House**, and how it fits the Shine app.
Figures checked on lotsawahouse.org on **2 Nov 2026**.

---

## 1. Lotsawa House at a glance

| | |
|---|---|
| Website | https://www.lotsawahouse.org |
| Total size | **6,000+ texts** (all languages combined) |
| Languages | 9 — English, Tibetan, German, Spanish, French, Italian, Dutch, Portuguese, Chinese |
| Formats | Web pages, plus EPUB and PDF downloads (per text and per topic collection) |
| License | **CC BY-NC 4.0** — free to copy and adapt *with attribution*, *non-commercial only* |
| Text length | Mostly **short**: prayers, verses of advice, mind-training texts (often 1–5 pages) |
| Watch out for | Texts marked **"Restricted"** — tantric practices meant only for people who have received the empowerment. **Do not use these in Shine.** |

### How the library is organised
- **Words of the Buddha** — sūtras and quotations from the Kangyur
- **Indian Masters** — Atiśa, Nāgārjuna, Śāntideva, etc.
- **Tibetan Masters** — Patrul Rinpoche, Longchenpa, Mipham, Jamyang Khyentse, Dilgo Khyentse, Tokme Zangpo, etc.
- **Topics** — hundreds of topic tags (one text can belong to several topics)

---

## 2. Kinds of content

| Type | What it is | Useful for Shine? |
|---|---|---|
| Advice | Short practical counsel from masters to students | ✅ Core material |
| Mind Training (Lojong) | Practical methods for compassion and transforming difficulties | ✅ Core material |
| Meditation instructions | Calm abiding (śamatha), insight, mindfulness | ✅ Core material |
| Aspiration prayers | Short verses of wishes for oneself and others | ✅ Good for session endings |
| Songs & poems | Spiritual songs, e.g. on impermanence | ✅ Good for reflections |
| Quotations | Popular verses from classic texts | ✅ Daily quote cards |
| Commentaries | Explanations of root texts | ⚠️ Background reading |
| Sādhanas / rituals | Deity practices, mantras, rituals | ❌ Mostly restricted — avoid |
| Biography / history / notes | Lives of masters, lineage history | ❌ Not for sessions |

---

## 3. English texts in topics most relevant to Shine

| Topic | English texts | Notes |
|---|---:|---|
| Advice | **235** | Largest pool; varies from beginner to very advanced (Dzogchen) |
| Meditation | **25** | Includes calm abiding (śamatha) instructions |
| Dying & the Bardos | **21** | Death, loss, preparing for death |
| Sickness & Healing | **20** | Many are restricted sādhanas; a few advice texts are usable |
| Bodhicitta | **17** | Compassion, refuge, the Four Immeasurables |
| Mind Training (Lojong) | **14** | Plus sub-collections: Seven Points of Mind Training (6), Parting from the Four Attachments (7) |
| Impermanence | **8** | Short, powerful reflections |
| Mindfulness | **5** | Short texts on mindfulness and vigilance |

> Counts overlap — one text can appear under several topics.

---

## 4. Draft mapping: life difficulty → starter texts

| Shine playlist | Example Lotsawa House texts |
|---|---|
| Restless mind / can't focus | *How to Cultivate Concentration* (Mipham) · *The Importance of Mindfulness and Vigilance* (Mipham) · *A Clear and Concise Description of the Practice of Śamatha* (Khenpo Pema Vajra) |
| Hard times & suffering | *Turning Suffering & Happiness into Enlightenment* (Dodrupchen) · *How to Transform Sickness and Other Circumstances* (Tokme Zangpo) |
| Anger & difficult people | *Eight Verses of Training the Mind* (Langri Thangpa) · *The Thirty-Seven Practices of All the Bodhisattvas* (Tokme Zangpo) |
| Compassion & kindness | *Commentary on the Four Immeasurables* (Buddhagupta) · *Aspiration to Generate Bodhicitta* (Patrul Rinpoche) |
| Change, loss & impermanence | *Verses of Advice for Meditating on Impermanence* (Könchok Tenpe Drönme) · *When Flowers Were Ravaged by the Frost* (Jamyang Khyentse Chökyi Lodrö) |
| Grief & death | *A Brief Introduction to the Bardos* (Patrul Rinpoche) · *Advice for a Dying Practitioner* (Dodrupchen) |
| Missing family | *Advice on Remembering One's Parents* (Khyenrab Chökyi Özer) |
| Simplicity & what matters | *Thirty Pieces of Heart Advice* (Longchenpa) · *Advice on Abandoning the Eight Worldly Concerns* (Nyala Pema Dündul) |
| Beginners | *Advice for Beginners* (Mipham) · *Advice for Beginners: How to Overcome Obstacles to Meditation* (Adzom Gyalse) |

Target for the hackathon demo: **20–40 texts across 8–10 playlists.**

---

## 5. Secondary source: 84000

| | |
|---|---|
| Website | https://84000.co |
| Content | English translations of the Kangyur (words of the Buddha) and Tengyur (commentaries) |
| Size | Kangyur = 1,169 texts / ~70,000 pages, about 50% published; Tengyur ≈ 1% published |
| License | Translations: **CC BY-NC-ND** (no adaptations allowed). Glossary & translation memory: **CC BY 4.0** |
| Use in Shine | Glossary only (accurate Buddhist terms in English/Tibetan). Long sūtras are not suited to short sessions. |

---

## 6. Rules for using the data

1. Credit every session: *"Based on [Title], by [Author], tr. [Translator], Lotsawa House, CC BY-NC 4.0."*
2. Never use texts marked **Restricted**.
3. Keep Shine **free / non-commercial** while using Lotsawa House content. Before charging money, get permission from translators or replace with our own content.
4. Present content as **Buddhist practice and reflection**, not medical or mental-health advice.
