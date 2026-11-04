"""Shared lesson data and text fingerprints for builds and audio generation."""

import hashlib
import json
import math
from pathlib import Path
import re

ROOT = Path(__file__).resolve().parents[1]
WEB_DIR = ROOT / "web"
SOURCE_FILE = ROOT / "data/lotsawa/raw/lotsawa_texts_2026-11-02.json"


def load_json(path):
    return json.loads(Path(path).read_text(encoding="utf-8"))


def paragraph_digest(paragraphs):
    serialized = json.dumps(paragraphs, ensure_ascii=False)
    return hashlib.sha256(serialized.encode()).hexdigest()


def clean_body(source):
    lines = [line.strip() for line in source["body"].split("\n")]
    while lines and (
        not lines[0]
        or lines[0] == source["title"]
        or lines[0].lower().startswith("by ")
        or lines[0].startswith(("revealed by", "attributed to"))
    ):
        lines.pop(0)

    body = []
    for line in lines:
        if line in {"Bibliography", "Tibetan Edition", "Secondary Sources", "Further Reading"}:
            break
        if not line.startswith(("|", "Version:")):
            body.append(line)
    return [p.strip() for p in re.split(r"\n\s*\n", "\n".join(body)) if p.strip()]


def load_lessons(source_path=SOURCE_FILE):
    """Keep source ordering: LH identifiers are used by saved items and media."""
    lessons = []
    for index, source in enumerate(load_json(source_path), 1):
        paragraphs = clean_body(source)
        words = sum(len(p.split()) for p in paragraphs)
        playlist = source["playlist"]
        if playlist in {"missing-family", "relationships-friends"}:
            playlist = "family-friends"
        lessons.append({
            "id": f"LH{index:03d}",
            "title": source["title"],
            "author": source["author"],
            "playlist": playlist,
            **{key: source[key] for key in ("credit", "url", "version", "retrieved")},
            "minutes": max(1, math.ceil(words / 180)),
            "paras": paragraphs,
        })
    return lessons
