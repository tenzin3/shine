"""Generate one artwork per Shine lesson with Meta's Muse Image model.

Run on your Mac, from the shine folder:
    export MODEL_API_KEY="your-key"          # if not already in ~/.zshrc
    python3 tools/generate_images.py --only LH001   # test one image first
    python3 tools/generate_images.py                # then all the rest
    python3 tools/build_web.py                      # rebuild the app with the images

Cost: about $0.01 per image (29 lessons ≈ $0.30 of your $150 credits).
Images already in web/images/ are skipped, so you can re-run safely.
"""
import os, sys, json, base64, urllib.request, urllib.error, subprocess, argparse, time

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, "web", "images")
BASE = os.environ.get("MODEL_API_BASE", "https://api.meta.ai/v1")
MODEL = os.environ.get("MUSE_IMAGE_MODEL", "muse-image-1.0")

STYLE = ("Fine-art landscape photograph, soft natural light, calm and spacious, "
         "gentle blue and violet dusk tones with warm golden highlights, shallow depth of field, "
         "square composition. No people, no faces, no text, no letters, no religious figures or statues.")

SCENES = {
 "LH001": "A perfectly still alpine lake at dawn with a single small ripple, snow peaks reflected in the water",
 "LH002": "A single butter lamp burning with a steady flame in a dark, quiet monastery hall, warm glow",
 "LH003": "A small cairn of smooth river stones beside calm water in soft morning mist",
 "LH004": "A mirror-still high-altitude lake under a clear sky, one snow-capped peak",
 "LH005": "A round polished brass mirror resting on maroon cloth, reflecting sky and soft clouds",
 "LH006": "Rain clouds parting over a green Himalayan valley, sunbeams breaking through",
 "LH007": "A cup of steaming herbal tea on a wooden window sill, raindrops on the glass, prayer beads beside it",
 "LH008": "A pink lotus rising from a muddy pond at sunrise",
 "LH009": "Wild medicinal herbs and small flowers on a high mountain meadow, morning dew",
 "LH010": "Warm sunlight shining through colourful prayer flags on a high mountain pass",
 "LH011": "A long stone stairway winding up a hill to a white stupa at golden hour",
 "LH012": "A mala of turquoise and coral beads resting on weathered wood, soft window light",
 "LH013": "Four butter lamps glowing in a row with soft warm bokeh",
 "LH014": "Sunrise over a sea of clouds seen from a Himalayan peak",
 "LH015": "A calm ocean at dawn with gentle waves and warm pink light",
 "LH016": "Autumn clouds drifting past a mountainside of golden larch trees",
 "LH017": "Frost-covered wildflowers glistening in early morning light",
 "LH018": "A steaming cup by a window looking out on quiet snowy peaks at dawn",
 "LH019": "A starry night sky and the Milky Way above the silhouette of a small stupa",
 "LH020": "Last evening light fading over a quiet valley, long soft shadows",
 "LH021": "A small Himalayan village house at dusk with warm light glowing in one window",
 "LH022": "A simple stone hermit's hut on a mountainside in clear morning light",
 "LH023": "An empty winding path across open high-plateau grassland under a wide sky",
 "LH024": "A lone juniper tree on a windy ridge with drifting mist",
 "LH025": "A mountain trail marked by three stone cairns leading toward a snow peak",
 "LH026": "Two yaks grazing side by side on a green meadow, prayer flags in the far distance",
 "LH027": "A tiny green sapling sprouting from moss, morning dew drops",
 "LH028": "A soft path through a pine forest with dappled morning light",
 "LH029": "An eagle soaring above a mountain range at dawn",
}

def post(path, body):
    key = os.environ.get("MODEL_API_KEY")
    if not key: sys.exit("MODEL_API_KEY is not set. Run: export MODEL_API_KEY=\"your-key\"")
    req = urllib.request.Request(BASE + path, data=json.dumps(body).encode(), method="POST",
        headers={"Authorization": f"Bearer {key}", "Content-Type": "application/json"})
    with urllib.request.urlopen(req, timeout=180) as r:
        return json.loads(r.read())

def fetch_bytes(item):
    if item.get("b64_json"): return base64.b64decode(item["b64_json"])
    if item.get("url"):
        with urllib.request.urlopen(item["url"], timeout=120) as r: return r.read()
    raise ValueError("No image in response: " + json.dumps(item)[:300])

def generate(prompt):
    attempts = [
        {"model": MODEL, "prompt": prompt, "n": 1, "size": "1024x1024", "response_format": "b64_json"},
        {"model": MODEL, "prompt": prompt, "aspect_ratio": "1:1"},
        {"model": MODEL, "prompt": prompt},
    ]
    last = None
    for body in attempts:
        try:
            data = post("/images/generations", body)
            return fetch_bytes((data.get("data") or [data])[0])
        except urllib.error.HTTPError as e:
            last = f"HTTP {e.code}: {e.read().decode(errors='replace')[:500]}"
        except Exception as e:
            last = str(e)
    raise RuntimeError(last)

def main():
    ap = argparse.ArgumentParser(); ap.add_argument("--only", nargs="*"); ap.add_argument("--redo", action="store_true")
    a = ap.parse_args(); os.makedirs(OUT, exist_ok=True)
    log_path = os.path.join(OUT, "credits.json")
    log = json.load(open(log_path)) if os.path.exists(log_path) else {}
    ids = a.only or list(SCENES)
    for i in ids:
        dst = os.path.join(OUT, f"{i}.jpg")
        if os.path.exists(dst) and not a.redo: print(i, "exists, skipping"); continue
        prompt = SCENES[i] + ". " + STYLE
        print(i, "generating…", flush=True)
        try:
            raw = generate(prompt)
        except Exception as e:
            print(f"  failed: {e}\n  Paste this error to Claude if it keeps happening."); continue
        tmp = os.path.join(OUT, f"{i}.raw")
        open(tmp, "wb").write(raw)
        try:  # macOS: convert to a 720px JPEG to keep the app light
            subprocess.run(["sips", "-s", "format", "jpeg", "-s", "formatOptions", "82", "-Z", "720", tmp, "--out", dst],
                           check=True, capture_output=True)
            os.remove(tmp)
        except Exception:
            os.replace(tmp, dst)
        log[i] = {"model": MODEL, "prompt": prompt, "generated": time.strftime("%Y-%m-%d"), "note": "AI-generated with Meta Muse Image"}
        json.dump(log, open(log_path, "w"), indent=1)
        print("  saved", os.path.relpath(dst, ROOT))
    print("Done. Now run: python3 tools/build_web.py")

if __name__ == "__main__":
    main()
