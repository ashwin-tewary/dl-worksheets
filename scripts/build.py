"""Rebuild all generated presentation and practice sheets."""
from pathlib import Path
import runpy
for script in ("build_practice.py", "build_presentations.py"):
    runpy.run_path(str(Path(__file__).resolve().parent / script), run_name="__main__")
