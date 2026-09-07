#!/usr/bin/env bash
# PostToolUse: prettier-format the edited file. Reads hook JSON from stdin.
# Uses node (available in a Vite project) to parse; degrades gracefully.
set -euo pipefail
input="$(cat)"
file="$(printf '%s' "$input" | node -e 'let s="";process.stdin.on("data",d=>s+=d).on("end",()=>{try{process.stdout.write(JSON.parse(s).tool_input.file_path||"")}catch(e){}})' 2>/dev/null || true)"
[ -z "${file:-}" ] && exit 0
case "$file" in
  *.ts|*.tsx|*.css|*.json) npx prettier --write "$file" >/dev/null 2>&1 || true ;;
esac
exit 0
