"""Validate local asset/navigation targets, including figure paths embedded in JS."""
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import unquote, urlsplit
import re

ROOT = Path(__file__).resolve().parents[1]
errors = []
class Links(HTMLParser):
    def __init__(self):
        super().__init__()
        self.urls = []
    def handle_starttag(self, tag, attrs):
        for key, value in attrs:
            if key in ("href", "src") and value:
                self.urls.append(value)

pages = [ROOT / 'index.html', *ROOT.glob('practice/*/index.html'),
         *ROOT.glob('presentations/*/index.html'), *ROOT.glob('*regularisation.html'),
         ROOT / 'worksheet_generalisation.html']
for page in pages:
    text = page.read_text(encoding='utf-8')
    parser = Links()
    parser.feed(text)
    urls = parser.urls + re.findall(r'["\']((?:\.\./)*figs/[^"\']+)["\']', text)
    for url in urls:
        parsed = urlsplit(url)
        if parsed.scheme or parsed.netloc or not parsed.path:
            continue
        target = (page.parent / unquote(parsed.path)).resolve()
        if not target.is_relative_to(ROOT):
            errors.append(f'{page.relative_to(ROOT)}: outside repository: {url}')
        elif not target.exists():
            errors.append(f'{page.relative_to(ROOT)}: missing {url}')
        elif target.is_dir() and not (target / 'index.html').exists():
            errors.append(f'{page.relative_to(ROOT)}: no index at {url}')
if errors:
    raise SystemExit('\n'.join(errors))
print(f'Local links and figure references pass across {len(pages)} pages.')
