# -*- coding: utf-8 -*-
from pathlib import Path
root = Path(__file__).resolve().parent
css = (root / "_lab_theme.css").read_text(encoding="utf-8")
extra = (root / "_lab_extra.css").read_text(encoding="utf-8")
body = (root / "lab_reg_markup.html").read_text(encoding="utf-8")
js = (root / "lab_reg.js").read_text(encoding="utf-8")
html = f"""<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>The Regularisation Lab · L2 → L1 → Dropout → BN → Early Stopping</title>
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
out = root / "lab_regularisation.html"
out.write_text(html, encoding="utf-8")
print("wrote", out, "bytes", out.stat().st_size)
