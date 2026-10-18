#!/usr/bin/env bash
set -euo pipefail

SOURCE_PDF="${1:?Usage: $0 /path/to/Healthy_Habits_Super_Kids_Free_Printables.pdf [output-dir]}"
OUTPUT_DIR="${2:-/tmp/super-kids-thumbnails}"
mkdir -p "$OUTPUT_DIR"

for page in $(seq 5 19); do
  pdftoppm -f "$page" -l "$page" -jpeg -scale-to 240 -singlefile "$SOURCE_PDF" "$OUTPUT_DIR/page-$page"
done

printf 'Generated %s lightweight thumbnails in %s.\n' "15" "$OUTPUT_DIR"
printf 'Upload them with: manus-upload-file --webdev %s/page-{5..19}.jpg\n' "$OUTPUT_DIR"
