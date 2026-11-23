#!/usr/bin/env python3
"""Rebuild the subset fonts in src/assets/fonts from the @fontsource packages.
Needs: pip install fonttools brotli. Run from the repo root: python3 scripts/subset-fonts.py
Inter is limited to weights 400 to 700; all three files cover Basic Latin, Latin-1 and common punctuation."""
import subprocess, tempfile, os
from fontTools.ttLib import TTFont
from fontTools.varLib import instancer

NM = 'node_modules'
OUT = 'src/assets/fonts'
U = 'U+0020-007E,U+00A0-00FF,U+0131,U+0152-0153,U+2013-2014,U+2018-201E,U+2022,U+2026,U+2032-2033,U+2039-203A,U+20AC,U+2122,U+2190-2193,U+2212,U+00D7'

def subset(src, dst, feats):
    subprocess.check_call(['pyftsubset', src, f'--unicodes={U}', '--flavor=woff2', f'--layout-features={feats}', '--no-hinting', f'--output-file={dst}'])

os.makedirs(OUT, exist_ok=True)
with tempfile.TemporaryDirectory() as d:
    f = TTFont(f'{NM}/@fontsource-variable/inter/files/inter-latin-wght-normal.woff2')
    f = instancer.instantiateVariableFont(f, {'wght': (400, 700)})
    tmp = os.path.join(d, 'inter.ttf')
    f.save(tmp)
    subset(tmp, f'{OUT}/inter-latin-400-700.woff2', 'kern,liga,calt,ccmp,locl,mark,mkmk,tnum,case')
for style, name in (('normal', 'instrument-serif-400'), ('italic', 'instrument-serif-400-italic')):
    subset(f'{NM}/@fontsource/instrument-serif/files/instrument-serif-latin-400-{style}.woff2', f'{OUT}/{name}.woff2', 'kern,liga,ccmp,locl,mark,mkmk')
