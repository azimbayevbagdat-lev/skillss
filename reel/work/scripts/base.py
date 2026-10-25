import json, subprocess
W="/home/user/skillss/reel/work/"
t=json.load(open(W+"timeline.json"))
segs=t["segments"]; parts=[]; v=[]; a=[]
for k,(s,e) in enumerate(segs):
    d=e-s
    parts.append(f"[0:v]trim=start={s}:end={e},setpts=PTS-STARTPTS[v{k}];")
    parts.append(f"[0:a]atrim=start={s}:end={e},asetpts=PTS-STARTPTS,afade=t=in:d=0.012,afade=t=out:st={d-0.012:.3f}:d=0.012[a{k}];")
    v.append(f"[v{k}][a{k}]")
fc="".join(parts)+"".join(v)+f"concat=n={len(segs)}:v=1:a=1[vc][ac];[vc]crop=464:824:0:12,scale=1080:1920:flags=lanczos,setsar=1,unsharp=5:5:0.55:5:5:0.0,eq=contrast=1.06:saturation=1.02,fps=30,format=yuv420p[vo]"
subprocess.run(["ffmpeg","-v","error","-y","-i",W+"../reel.mp4","-filter_complex",fc,"-map","[vo]","-map","[ac]",
  "-c:v","libx264","-crf","12","-preset","veryfast","-g","15","-c:a","pcm_s16le","-ar","48000",W+"base.mov"],check=True)
print("done")
