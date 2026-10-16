#!/usr/bin/env bash
# Chunked render: 4 muted video parts + audio, joined without re-encoding.
# Same settings as: npx remotion render How05 out/how05.mp4 --codec h264 --crf 16 --audio-bitrate 320k --gl=angle
set -euo pipefail
cd "$(dirname "$0")/.."
B=${BROWSER:-/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell}
TOTAL=$(npx remotion compositions --browser-executable="$B" 2>/dev/null | awk '/^How05 /{print $4}')
echo "total frames: $TOTAL"
mkdir -p out/parts
PARTS=4
STEP=$(( (TOTAL + PARTS - 1) / PARTS ))
: > out/parts/list.txt
for i in $(seq 0 $((PARTS - 1))); do
  A=$(( i * STEP )); Z=$(( (i + 1) * STEP - 1 )); (( Z >= TOTAL )) && Z=$(( TOTAL - 1 ))
  F=out/parts/part$i.mp4
  if [ ! -s "$F" ]; then
    echo "part $i: frames $A-$Z"
    npx remotion render How05 "$F.tmp.mp4" --codec h264 --crf 16 --gl=angle --muted \
      --frames=$A-$Z --concurrency=2 --timeout=120000 --browser-executable="$B" --log=error
    mv "$F.tmp.mp4" "$F"
  fi
  echo "file 'part$i.mp4'" >> out/parts/list.txt
done
npx remotion render How05 out/parts/audio.aac --codec aac --audio-bitrate 320k --browser-executable="$B" --log=error
ffmpeg -v error -y -f concat -safe 0 -i out/parts/list.txt -i out/parts/audio.aac -map 0:v -map 1:a -c copy -movflags +faststart out/how05.mp4
echo done
