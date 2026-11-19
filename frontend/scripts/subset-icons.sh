#!/usr/bin/env bash
# Gera public/fonts/material-symbols-subset.woff2 contendo apenas os ícones de scripts/icons.txt.
# Requer: pip install fonttools brotli. Rode novamente ao adicionar ícones (e commite o resultado).
set -euo pipefail
cd "$(dirname "$0")/.."
SRC=node_modules/material-symbols/material-symbols-outlined.woff2
TMP="$(mktemp -d)"
# Fixa eixos GRAD=0 e opsz=24; mantém FILL (0..1) e wght (100..700), como no protótipo.
fonttools varLib.instancer "$SRC" GRAD=0 opsz=24 -o "$TMP/pinned.woff2" -q
# Glifos = nomes dos ícones (+ variante .fill). Sem fechamento de layout, para não arrastar
# todas as ligaturas; as letras ficam só para formar o nome do ícone via ligatura.
GLYPHS="$(tr -s ' \n' ',' < scripts/icons.txt | sed 's/,$//')"
GLYPHS="$GLYPHS,$(tr -s ' \n' ',' < scripts/icons.txt | sed 's/,$//; s/,/.fill,/g').fill"
pyftsubset "$TMP/pinned.woff2" \
  --glyphs="$GLYPHS" --unicodes='U+0030-0039,U+005F,U+0061-007A' \
  --ignore-missing-glyphs --no-layout-closure --layout-features='rclt,rlig' --flavor=woff2 \
  --output-file=public/fonts/material-symbols-subset.woff2
ls -la public/fonts/material-symbols-subset.woff2
