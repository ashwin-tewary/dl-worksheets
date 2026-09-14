# -*- coding: utf-8 -*-
from pathlib import Path
root = Path(__file__).resolve().parents[1]
css = (root / "src/presentations/regularisation/theme.css").read_text(encoding="utf-8").rstrip()
extra = (root / "src/presentations/regularisation/extra.css").read_text(encoding="utf-8")
body = (root / "src/presentations/regularisation/content.html").read_text(encoding="utf-8")
js = (root / "src/presentations/regularisation/interactions.js").read_text(encoding="utf-8")
html = f"""<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Regularisation · Lecture presentation sheet · L2 → L1 → Dropout → BN → Early Stopping</title>
<style>
{css}
{extra}
</style>
</head>
<body>
{body}
<script>
"use strict";
{js}
</script>
</body>
</html>
"""
out = root / "presentations/regularisation/index.html"
out.parent.mkdir(parents=True, exist_ok=True)
html = html.replace('src="figs/', 'src="../../figs/').replace('href="index.html"', 'href="../../index.html"')
out.write_text(html, encoding="utf-8")
print("wrote", out, "bytes", out.stat().st_size)
