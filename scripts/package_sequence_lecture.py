"""Build a small, completely local lecture bundle; exclude dev dependencies."""
from pathlib import Path
import shutil
import zipfile

REPO = Path(__file__).resolve().parents[1]
SOURCE = REPO / "presentations" / "sequence-modelling"
OUTPUT = REPO.parent / "output" / "lecture-assets"
BUNDLE = OUTPUT / "sequence-modelling-lecture-assets"
WORKSHEET = BUNDLE / "worksheet"
WORKSHEET.mkdir(parents=True, exist_ok=True)

files = [
    "index.html", "styles.css", "model.js", "timeline.js", "storyboards.js",
    "scenes.js", "app.js", "student-handout.html", "instructor-guide.md",
    "storyboard-guide.md",
]
for name in files:
    shutil.copy2(SOURCE / name, WORKSHEET / name)
shutil.copytree(SOURCE / "assets", WORKSHEET / "assets", dirs_exist_ok=True)
index = WORKSHEET / "index.html"
index.write_text(index.read_text().replace("../../index.html", "../index.html"))
(BUNDLE / "index.html").write_text("""<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Sequence modelling lecture pack</title>
<style>body{max-width:760px;margin:70px auto;padding:0 25px;background:#f6f4ed;color:#183c35;font:18px/1.8 system-ui}h1{font:48px/1.1 Georgia,serif}a{color:#12655b}li{margin:15px 0}</style>
</head><body><p>DEEP LEARNING · LECTURE ASSETS</p><h1>Remember what came before.</h1>
<p>Sequential data intuition, RNN unrolling, and long-term dependencies. An 85-minute teaching route for first-time sequence learners.</p>
<ul><li><a href="worksheet/index.html">Open the interactive worksheet</a></li>
<li><a href="worksheet/student-handout.html">Print the student handout</a></li>
<li><a href="worksheet/assets/gallery.html">Open six reusable SVG figures</a></li>
<li><a href="worksheet/instructor-guide.md">Instructor guide and worked answers</a></li>
<li><a href="worksheet/storyboard-guide.md">Animation storyboard and narration</a></li></ul>
<p>Everything needed by the worksheet is included. Keep the folder structure intact.</p></body></html>""")
(BUNDLE / "README.md").write_text("""# Sequence modelling lecture assets

Open **index.html** to choose an asset, or open **worksheet/index.html** directly.
No installation, internet connection, model download or build step is required.
Keep the folder structure intact. Browser answer saving is local to the current
origin/device; use “Save my answers” to export a text copy.

## Included

- Interactive 85-minute lecture worksheet with five learning sections.
- Six guided animated explainers: order, targets, hidden state, unrolling,
  forward clue propagation and backward sensitivity.
- Play/pause, prediction stops, stepping, replay, speed, scrubbing and SVG export.
- Fifteen checked questions, worked explanations, and a synthesis exit ticket.
- Six original numbered SVG figures and a gallery for projection.
- A printable student handout, instructor answer key and full animation narration.
- Keyboard controls, reduced-motion support, responsive layout and print styles.

## Teaching route

Intention 5 min → order 12 → inputs/targets 12 → state 16 → unrolling 18 →
long dependencies 17 → exit 5. See worksheet/instructor-guide.md for a 60-minute route.

For a served preview, run python3 -m http.server 8000 in this folder and open
http://localhost:8000/. Direct file opening also works; some browser privacy
settings restrict saved progress under file URLs.

These numerical examples are explicit teaching toys, not trained models.
Forward state, backward state sensitivity and accumulated parameter gradients
are distinguished throughout. All image matrices contain readable numbers.

Source location in the course repository: presentations/sequence-modelling/.
Reading references are linked at the end of the worksheet.
""")

archive = OUTPUT / (BUNDLE.name + ".zip")
with zipfile.ZipFile(archive, "w", zipfile.ZIP_DEFLATED) as z:
    for file in sorted(BUNDLE.rglob("*")):
        if file.is_file():
            z.write(file, file.relative_to(OUTPUT))
print(f"Bundle: {BUNDLE}")
print(f"Archive: {archive} ({archive.stat().st_size:,} bytes)")
