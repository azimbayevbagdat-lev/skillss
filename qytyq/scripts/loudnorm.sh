#!/usr/bin/env bash
# Two-pass EBU R128 loudness normalisation of the final mix to -14 LUFS, video stream copied.
set -euo pipefail
in=${1:-output/qytyq_raw.mp4}; out=${2:-output/qytyq.mp4}
m=$(ffmpeg -hide_banner -i "$in" -af loudnorm=I=-14:TP=-1:LRA=11:print_format=json -f null - 2>&1 | sed -n '/^{/,/^}/p')
g() { echo "$m" | python3 -c "import json,sys;print(json.load(sys.stdin)['$1'])"; }
ffmpeg -hide_banner -loglevel error -y -i "$in" -c:v copy -af "loudnorm=I=-14:TP=-1:LRA=11:measured_I=$(g input_i):measured_TP=$(g input_tp):measured_LRA=$(g input_lra):measured_thresh=$(g input_thresh):offset=$(g target_offset):linear=true,aresample=48000" -c:a aac -b:a 192k -movflags +faststart "$out"
echo "wrote $out"
