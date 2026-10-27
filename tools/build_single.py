"""Bundles homepage-v3 into one self-contained HTML file (CSS, JS, images and fonts inlined) for sharing by email or chat.
Usage: python tools/build_single.py [out.html]   Fonts are fetched from Google Fonts once; offline, the page falls back to system fonts."""
import re, sys, base64, mimetypes, pathlib, urllib.request

ROOT = pathlib.Path(__file__).resolve().parent.parent
OUT = pathlib.Path(sys.argv[1]) if len(sys.argv) > 1 else ROOT / 'dist' / 'Aquiline-homepage-interactive.html'
mimetypes.add_type('image/webp', '.webp')
GF = 'https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600&family=Montserrat:wght@400;500;600;700&display=swap'
UA = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120 Safari/537.36'}


def data_uri(rel):
    p = ROOT / rel.lstrip('./')
    return f'data:{mimetypes.guess_type(str(p))[0]};base64,' + base64.b64encode(p.read_bytes()).decode()


def fonts():
    try:
        css = urllib.request.urlopen(urllib.request.Request(GF, headers=UA), timeout=30).read().decode()
        cache = {}

        def one(m):
            u = m.group(1)
            if u not in cache:
                cache[u] = 'data:font/woff2;base64,' + base64.b64encode(urllib.request.urlopen(u, timeout=30).read()).decode()
            return f'url({cache[u]})'
        faces = [b for s, b in re.findall(r'/\* (\S+) \*/\s*(@font-face.*?\})', css, re.S) if s in ('latin', 'latin-ext')]
        return '\n'.join(re.sub(r'url\((https[^)]+)\)', one, b) for b in faces)
    except Exception as e:  # offline build: keep the Google link so fonts still load when the viewer is online
        print('fonts not inlined:', e)
        return None


html = (ROOT / 'index.html').read_text(encoding='utf8')
css = (ROOT / 'styles.css').read_text(encoding='utf8')
js = (ROOT / 'app.js').read_text(encoding='utf8')

css = re.sub(r'url\(\./(assets/[^)]+)\)', lambda m: f'url({data_uri(m.group(1))})', css)
html = re.sub(r'src="\./(assets/[^"]+)"', lambda m: f'src="{data_uri(m.group(1))}"', html)

f = fonts()
if f:
    html = re.sub(r'<link rel="preconnect"[^>]*>\s*', '', html)
    html = re.sub(r'<link rel="stylesheet" href="https://fonts[^>]*>', '', html)
html = html.replace('<link rel="stylesheet" href="./styles.css">', f'<style>\n{f or ""}\n{css}\n</style>')
html = html.replace('<script src="./app.js"></script>', f'<script>\n{js}\n</script>')

left = re.findall(r'(?:src|href)="\./[^"]*"|url\(\./[^)]*\)', html)
assert not left, left[:5]
OUT.parent.mkdir(exist_ok=True)
OUT.write_text(html, encoding='utf8')
print(OUT, OUT.stat().st_size // 1024, 'KB')
