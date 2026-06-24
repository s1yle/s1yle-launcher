#!/bin/bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SWAGGER_FILE="${ROOT_DIR}/swagger.json"
OUTPUT_DIR="${ROOT_DIR}/src/server"

if [ ! -f "$SWAGGER_FILE" ]; then
  echo "❌ swagger.json not found at ${SWAGGER_FILE}"
  exit 1
fi

rm -rf "$OUTPUT_DIR"

if command -v openapi-ts &>/dev/null; then
  CMD="openapi-ts"
elif command -v npx &>/dev/null; then
  echo "openapi-ts not found globally, using npx..."
  CMD="npx --yes @hey-api/openapi-ts"
else
  echo "❌ openapi-ts not found. Install globally: npm install -g @hey-api/openapi-ts"
  exit 1
fi

$CMD -i "$SWAGGER_FILE" -o "$OUTPUT_DIR"

echo "✅ API client regenerated at ${OUTPUT_DIR}"
