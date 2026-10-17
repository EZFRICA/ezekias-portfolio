"""Stamp asset URLs with a content hash so they can be cached for a year.

Run after changing anything in public/assets/site or public/assets/fonts:
    python3 tools/stamp.py
Every reference like /assets/site/site.css becomes /assets/site/site.css?v=<8-char hash>.
"""
import glob
import hashlib
import os
import re

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'public')
PATTERN = re.compile(r'(/assets/(?:site|fonts)/[\w.-]+\.(?:css|js|woff2))(?:\?v=[0-9a-f]+)?')


def digest(url_path):
    with open(os.path.join(ROOT, url_path.lstrip('/')), 'rb') as f:
        return hashlib.md5(f.read()).hexdigest()[:8]


def main():
    pages = glob.glob(os.path.join(ROOT, '*.html')) + glob.glob(os.path.join(ROOT, 'research', '*.html'))
    # site.css references the fonts, so stamp it first and hash it afterwards
    css = os.path.join(ROOT, 'assets', 'site', 'site.css')
    for path in [css] + pages:
        with open(path) as f:
            text = f.read()
        new = PATTERN.sub(lambda m: f'{m.group(1)}?v={digest(m.group(1))}', text)
        if new != text:
            with open(path, 'w') as f:
                f.write(new)
            print('stamped', os.path.relpath(path, ROOT))


if __name__ == '__main__':
    main()
