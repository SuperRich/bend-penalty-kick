#!/bin/sh
set -eu
out=${1:-/tmp/bend-penalty-aim.png}
port=${2:-8765}
root=$(cd "$(dirname "$0")/.." && pwd)
python3 -m http.server --directory "$root/docs" "$port" >/tmp/bend-http.log 2>&1 &
pid=$!
trap 'kill $pid 2>/dev/null || true' EXIT
i=0
while [ "$i" -lt 40 ]; do
  if curl -sf "http://127.0.0.1:$port/" >/dev/null; then
    break
  fi
  i=$((i + 1))
  sleep 0.1
done
timeout 25 google-chrome \
  --headless=new \
  --disable-gpu \
  --hide-scrollbars \
  --no-first-run \
  --user-data-dir=/tmp/bend-chrome \
  --enable-unsafe-swiftshader \
  --use-gl=angle \
  --use-angle=swiftshader \
  --ignore-gpu-blocklist \
  --window-size=1280,800 \
  --virtual-time-budget=5000 \
  --screenshot="$out" \
  "http://127.0.0.1:$port/"
echo "$out"
