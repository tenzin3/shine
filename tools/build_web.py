"""Build shine/web/index.html from data/lotsawa/raw/*.json.
Run from the shine folder:  python3 tools/build_web.py
"""
import json, re, os, sys, math
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
raw = json.load(open(os.path.join(ROOT, "data/lotsawa/raw/lotsawa_texts_2026-11-02.json")))

def clean(o):
    lines = [l.strip() for l in o["body"].split("\n")]
    # drop repeated title / byline at the top
    while lines and (not lines[0] or lines[0] == o["title"] or lines[0].lower().startswith("by ") or lines[0].startswith("revealed by") or lines[0].startswith("attributed to")):
        lines.pop(0)
    out = []
    for l in lines:
        if re.match(r"^(Bibliography|Tibetan Edition|Secondary Sources|Further Reading)$", l): break
        if l.startswith("|") or l.startswith("Version:"): continue
        out.append(l)
    text = "\n".join(out)
    paras = [p.strip() for p in re.split(r"\n\s*\n", text) if p.strip()]
    return paras

items = []
for i, o in enumerate(raw, 1):
    paras = clean(o)
    words = sum(len(p.split()) for p in paras)
    pl = o["playlist"]
    if pl in ("missing-family", "relationships-friends"): pl = "family-friends"
    items.append({
        "id": f"LH{i:03d}", "title": o["title"], "author": o["author"], "playlist": pl,
        "credit": o["credit"], "url": o["url"], "version": o["version"], "retrieved": o["retrieved"],
        "minutes": max(1, math.ceil(words / 180)), "paras": paras,
    })

import base64
tpl = open(os.path.join(ROOT, "tools/template.html")).read()
img_dir = os.path.join(ROOT, "web/images")
local_img, embed_img = {}, {}
for it in items:
    f = os.path.join(img_dir, it["id"] + ".jpg")
    if os.path.exists(f):
        local_img[it["id"]] = "images/" + it["id"] + ".jpg"
        embed_img[it["id"]] = "data:image/jpeg;base64," + base64.b64encode(open(f, "rb").read()).decode()
print(len(local_img), "lesson images found")
base = tpl.replace("/*__DATA__*/[]", json.dumps(items, ensure_ascii=False))
page_local = base.replace("/*__IMG__*/{}", json.dumps(local_img))
page = base.replace("/*__IMG__*/{}", json.dumps(embed_img))
os.makedirs(os.path.join(ROOT, "web"), exist_ok=True)
open(os.path.join(ROOT, "web/index.html"), "w").write("<!doctype html>\n<html lang=\"en\"><head><meta charset=\"utf-8\"><meta name=\"viewport\" content=\"width=device-width, initial-scale=1, viewport-fit=cover\"></head><body>\n" + page_local + "\n</body></html>\n")
open(os.path.join(ROOT, "web/shine_artifact.html"), "w").write(page)
print(len(items), "texts built into web/index.html")
